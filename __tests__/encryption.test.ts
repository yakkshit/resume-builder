import { describe, it, expect } from 'vitest'
import { encryptPayload, decryptPayload } from '@/lib/crypto/encryption'

describe('Zero-Knowledge AES-256-GCM Encryption', () => {
  const testPassphrase = 'user_super_secure_passphrase_123'
  const sampleData = {
    chatId: 'session-42',
    messages: [
      { role: 'user', content: 'Tailor my resume for Google Staff SWE' },
      { role: 'assistant', content: "Here's your tailored resume draft" },
    ],
    resumeData: {
      basicInfo: { name: 'Alice Developer', email: 'alice@example.com' },
    },
  }

  it('encrypts data into ciphertext envelope and decrypts back successfully', async () => {
    const encrypted = await encryptPayload(sampleData, testPassphrase)
    expect(typeof encrypted).toBe('string')
    expect(encrypted).not.toContain('Alice Developer')

    const decrypted = await decryptPayload(encrypted, testPassphrase)
    const parsed = JSON.parse(decrypted)
    expect(parsed.chatId).toBe('session-42')
    expect(parsed.resumeData.basicInfo.name).toBe('Alice Developer')
  })

  it('fails decryption when provided an invalid passphrase', async () => {
    const encrypted = await encryptPayload('Top secret career notes', testPassphrase)
    await expect(decryptPayload(encrypted, 'wrong_passphrase')).rejects.toThrow()
  })

  it('fails decryption if ciphertext is tampered with', async () => {
    const encrypted = await encryptPayload('Safe data', testPassphrase)
    const envelope = JSON.parse(encrypted)
    envelope.ciphertext = 'AAAA' + envelope.ciphertext.slice(4) // Tamper
    await expect(decryptPayload(JSON.stringify(envelope), testPassphrase)).rejects.toThrow()
  })
})
