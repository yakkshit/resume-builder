/**
 * Build an embeddable video URL for iframe src from env or user-provided links.
 * Supports YouTube watch/shorts youtu.be and plain embed URLs.
 */
export function toVideoEmbedSrc(input: string | undefined | null): string | null {
  const raw = (input ?? "").trim()
  if (!raw) return null
  if (raw.includes("youtube.com/embed/")) return raw
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, "")
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.startsWith("/embed/")) return raw
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/")[2]
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
      const v = u.searchParams.get("v")
      return v ? `https://www.youtube.com/embed/${v}` : null
    }
    return raw
  } catch {
    return raw
  }
}
