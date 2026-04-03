import { mkdir, readFile, appendFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"

const MEMORY_DIR = ".memory"
const MEMORY_ROOT = process.env.VERCEL
  ? resolve("/tmp", MEMORY_DIR)
  : resolve(process.cwd(), MEMORY_DIR)
const CORE_PATH = join(MEMORY_ROOT, "core.md")
const NOTES_PATH = join(MEMORY_ROOT, "notes.md")
const CONVERSATIONS_PATH = join(MEMORY_ROOT, "conversations.jsonl")

const DEFAULT_CORE = `# Core Memory
- Keep this short and stable.
- Store durable user preferences and evergreen facts.
`

const DEFAULT_NOTES = `# Notes
Timestamped details and summaries.
`

async function ensureFile(path: string, content: string) {
  try {
    await readFile(path, "utf8")
  } catch {
    await writeFile(path, content, "utf8")
  }
}

export async function ensureMemoryFilesystem() {
  try {
    await mkdir(MEMORY_ROOT, { recursive: true })
    await ensureFile(CORE_PATH, DEFAULT_CORE)
    await ensureFile(NOTES_PATH, DEFAULT_NOTES)
    await ensureFile(CONVERSATIONS_PATH, "")
  } catch {
    // Non-fatal in constrained runtimes; route falls back without memory persistence.
  }
}

export async function readCoreMemory(): Promise<string> {
  try {
    return await readFile(CORE_PATH, "utf8")
  } catch {
    return ""
  }
}

export async function readNotesMemory(): Promise<string> {
  try {
    return await readFile(NOTES_PATH, "utf8")
  } catch {
    return ""
  }
}

export async function overwriteCoreMemory(content: string) {
  try {
    await writeFile(CORE_PATH, content, "utf8")
  } catch {
    // ignore
  }
}

export async function appendNotes(line: string) {
  const s = line.endsWith("\n") ? line : `${line}\n`
  try {
    await appendFile(NOTES_PATH, s, "utf8")
  } catch {
    // ignore
  }
}

export async function appendConversation(entry: {
  sessionId?: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}) {
  const line = JSON.stringify(entry)
  try {
    await appendFile(CONVERSATIONS_PATH, `${line}\n`, "utf8")
  } catch {
    // ignore
  }
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with", "as", "is", "are", "was", "were",
  "i", "you", "we", "they", "it", "this", "that", "these", "those", "my", "your", "our",
])

function keywordsFromText(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !STOP.has(t))
    .slice(0, 8)
}

/**
 * Lightweight recall: grep-like scan of conversations.jsonl, returns up to N lines that contain any keyword.
 * (No vector DB; fast enough for small local logs.)
 */
export async function recallFromConversations(userText: string, limit = 12): Promise<string> {
  const keys = keywordsFromText(userText)
  if (!keys.length) return ""
  try {
    const raw = await readFile(CONVERSATIONS_PATH, "utf8")
    const lines = raw.split("\n").filter(Boolean)
    const matches: string[] = []
    for (let i = lines.length - 1; i >= 0 && matches.length < limit; i--) {
      const line = lines[i]
      const lower = line.toLowerCase()
      if (keys.some((k) => lower.includes(k))) matches.push(line)
    }
    return matches.reverse().join("\n")
  } catch {
    return ""
  }
}

