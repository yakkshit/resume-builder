/** Web compose targets for HR / outreach emails (no SMTP; opens provider draft in browser). */

export type EmailProviderId = "gmail" | "yahoo" | "hotmail" | "outlook" | "mailto";

export const EMAIL_PROVIDER_LABELS: Record<EmailProviderId, string> = {
  gmail: "Gmail",
  yahoo: "Yahoo Mail",
  hotmail: "Hotmail / Outlook (personal)",
  outlook: "Outlook (Microsoft 365 / web)",
  mailto: "Default mail app (mailto)",
};

export function isEmailProviderId(v: string): v is EmailProviderId {
  return v === "gmail" || v === "yahoo" || v === "hotmail" || v === "outlook" || v === "mailto";
}

export function normalizeDefaultEmailProvider(raw: string | undefined | null): EmailProviderId {
  const t = (raw || "").toLowerCase().trim();
  if (isEmailProviderId(t)) return t;
  return "gmail";
}

function enc(s: string): string {
  return encodeURIComponent(s ?? "");
}

export function buildEmailComposeUrl(
  provider: EmailProviderId,
  params: { to: string; subject: string; body: string },
): string {
  const to = params.to.trim();
  const subject = params.subject;
  const body = params.body;

  switch (provider) {
    case "gmail":
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`;
    case "yahoo":
      return `https://compose.mail.yahoo.com/?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`;
    case "hotmail":
    case "outlook":
      // Consumer Hotmail and Outlook web share the same compose deeplink pattern.
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(to)}&subject=${enc(subject)}&body=${enc(body)}`;
    case "mailto": {
      const q = new URLSearchParams();
      if (subject) q.set("subject", subject);
      if (body) q.set("body", body);
      const qs = q.toString();
      const addr = to.trim();
      return `mailto:${addr}${qs ? `?${qs}` : ""}`;
    }
    default:
      return buildEmailComposeUrl("mailto", params);
  }
}
