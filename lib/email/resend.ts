/**
 * Resend Email Integration
 * Used for sending job applications, cover letter drafts, and export notifications.
 */

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 or string
  }>;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export class EmailService {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    this.defaultFrom = process.env.EMAIL_FROM || "CareerAgent <onboarding@resend.dev>";
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
    if (!this.isConfigured) {
      console.info("[EmailService Mock] Sending email to:", payload.to, "Subject:", payload.subject);
      return {
        success: true,
        id: `mock-resend-${Date.now()}`,
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: payload.from || this.defaultFrom,
          to: Array.isArray(payload.to) ? payload.to : [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          attachments: payload.attachments,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        return { success: false, error: err.message || "Failed to send email via Resend" };
      }

      const data = await response.json();
      return { success: true, id: data.id };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Email sending error" };
    }
  }
}

export const emailService = new EmailService();
