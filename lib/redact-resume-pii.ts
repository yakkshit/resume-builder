/**
 * Redact personally identifiable information (PII) from resume data
 * before sending to AI models. Protects user privacy.
 *
 * Redacted fields: name, email, phone, location
 * Replaced with placeholders so the AI retains structure for tailoring.
 */

const PLACEHOLDERS = {
  name: "[Candidate Name]",
  email: "[email@example.com]",
  phone: "[Phone Number]",
  location: "[City, Country]",
  linkedin: "[LinkedIn URL]",
  website: "[Personal Website]",
} as const

export function redactResumePII(data: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!data || typeof data !== "object") return {}
  const copy = JSON.parse(JSON.stringify(data)) as Record<string, unknown>

  if (copy.basicInfo && typeof copy.basicInfo === "object") {
    const basicInfo = copy.basicInfo as Record<string, unknown>
    if (typeof basicInfo.name === "string" && basicInfo.name.trim())
      basicInfo.name = PLACEHOLDERS.name
    if (typeof basicInfo.email === "string" && basicInfo.email.trim())
      basicInfo.email = PLACEHOLDERS.email
    if (typeof basicInfo.phone === "string" && basicInfo.phone.trim())
      basicInfo.phone = PLACEHOLDERS.phone
    if (typeof basicInfo.location === "string" && basicInfo.location.trim())
      basicInfo.location = PLACEHOLDERS.location
    if (typeof basicInfo.linkedin === "string" && basicInfo.linkedin.trim())
      basicInfo.linkedin = PLACEHOLDERS.linkedin
    if (typeof basicInfo.website === "string" && basicInfo.website.trim())
      basicInfo.website = PLACEHOLDERS.website
  }

  return copy
}

/**
 * Redact PII patterns from arbitrary text (e.g. cover letter body).
 * Replaces emails, phone numbers with placeholders.
 */
export function redactTextPII(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return ""
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email@example.com]")
    .replace(/(?:\+?[\d\s\-()]{10,}|\d{3}[\s\-.]?\d{3}[\s\-.]?\d{4})/g, "[Phone Number]")
}
