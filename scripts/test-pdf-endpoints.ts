import { Buffer } from "node:buffer"

// Define a minimal test payload with photo
const testResumeWithPhoto = {
  resumeData: {
    basicInfo: {
      name: "Alex Johnson",
      title: "Software Engineer",
      email: "alex@example.com",
      phone: "+1234567890",
      location: "San Francisco, CA",
      linkedin: "alexj",
      website: "alexjohnson.dev",
      summary: "Experienced engineer.",
      // A valid 1x1 dummy image data URL to test profile picture rendering
      profilePicture: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      languages: ["English"],
      portfolioLinks: []
    },
    experience: [
      {
        company: "Tech Corp",
        position: "Developer",
        startDate: "2020-01",
        endDate: "Present",
        description: "Building stuff."
      }
    ],
    education: [],
    skills: ["TypeScript", "React"]
  },
  template: "modern"
}

// Minimal test payload without photo
const testResumeNoPhoto = {
  ...testResumeWithPhoto,
  resumeData: {
    ...testResumeWithPhoto.resumeData,
    basicInfo: {
      ...testResumeWithPhoto.resumeData.basicInfo,
      profilePicture: undefined
    }
  }
}

// Cover letter payload
const testCoverLetter = {
  coverLetterData: {
    head: "Dear Hiring Team,\n\nI am writing to express my interest...",
    body: "Throughout my career, I have...",
    footer: "Sincerely,\nAlex Johnson"
  },
  template: "standard"
}

// LaTeX payload
const testLatex = {
  latex: "\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}"
}

function isPdfBuffer(buf: Buffer): boolean {
  return (
    buf.length >= 4 &&
    buf[0] === 0x25 && // %
    buf[1] === 0x50 && // P
    buf[2] === 0x44 && // D
    buf[3] === 0x46    // F
  )
}

async function runTests() {
  const host = process.argv[2] || "http://localhost:3000"
  const apiKey = process.env.API_AUTH_KEY || process.env.APP_API_KEY || "qwerty123"

  console.log("======================================================================")
  console.log(`🚀 STARTING PDF ENDPOINTS VALIDATION`)
  console.log(`Host: ${host}`)
  console.log(`API Key (first 3 chars): ${apiKey.slice(0, 3)}...`)
  console.log("======================================================================\n")

  const endpoints = [
    {
      name: "POST /api/generate-pdf (Resume without photo)",
      url: `${host}/api/generate-pdf`,
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify(testResumeNoPhoto)
    },
    {
      name: "POST /api/generate-pdf (Resume WITH photo)",
      url: `${host}/api/generate-pdf`,
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify(testResumeWithPhoto)
    },
    {
      name: "POST /api/pdf/render (Resume without photo)",
      url: `${host}/api/pdf/render`,
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify(testResumeNoPhoto)
    },
    {
      name: "POST /api/pdf/render (Resume WITH photo)",
      url: `${host}/api/pdf/render`,
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify(testResumeWithPhoto)
    },
    {
      name: "POST /api/cover-letter/pdf (Cover Letter)",
      url: `${host}/api/cover-letter/pdf`,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCoverLetter)
    },
    {
      name: "POST /api/latex-pdf (LaTeX)",
      url: `${host}/api/latex-pdf`,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testLatex)
    }
  ]

  let failed = 0

  for (const endpoint of endpoints) {
    console.log(`👉 Testing: ${endpoint.name}...`)
    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: endpoint.headers as Record<string, string>,
        body: endpoint.body
      })

      if (!res.ok) {
        const text = await res.text()
        console.error(`  ❌ Failed (HTTP ${res.status}): ${text.slice(0, 500)}`)
        failed++
        continue
      }

      const arrBuf = await res.arrayBuffer()
      const buf = Buffer.from(arrBuf)

      const ct = res.headers.get("content-type") || ""
      const isPdfHeader = ct.includes("application/pdf")
      const hasPdfMagic = isPdfBuffer(buf)

      if (isPdfHeader && hasPdfMagic) {
        console.log(`  ✅ Success: Received valid PDF (${buf.length} bytes)`)
      } else {
        console.error(`  ❌ Failed: Content-Type is "${ct}", PDF magic bytes valid: ${hasPdfMagic}`)
        failed++
      }
    } catch (err) {
      console.error(`  ❌ Failed: Connection error - ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
    console.log("")
  }

  console.log("======================================================================")
  if (failed === 0) {
    console.log("🎉 ALL PDF ENDPOINTS VERIFIED SUCCESSFULLY!")
    process.exit(0)
  } else {
    console.error(`⚠️ VALIDATION COMPLETED WITH ${failed} FAILURE(S).`)
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error("Test execution aborted:", err)
  process.exit(1)
})
