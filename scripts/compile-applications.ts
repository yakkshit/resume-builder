import fs from "fs"
import path from "path"
import { sanitizeResumeData } from "../lib/sanitize-resume-data"
import { generateCoverLetterPDFBuffer } from "../lib/cover-letter-pdf-generator"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { getResumeTemplate } from "../components/pdf-templates"

const targets = [
  {
    company: "ArborSort_AI",
    email: "kilometer1@htwg-konstanz.de, errysun49@gmail.com",
    role: "Tech-Mitgründer / Werkstudent AI & Vision",
    cvTemplate: "german-modern",
    clTemplate: "german-anschreiben",
    sessionId: "1784745083178",
    index: 1,
  },
  {
    company: "Underwater_AI",
    email: "shreyas.nanikar@stud.hs-kempten.de",
    role: "Mitgründer / Werkstudent Robotics & SLAM",
    cvTemplate: "german-modern",
    clTemplate: "german-anschreiben",
    sessionId: "1784745083178",
    index: 3,
  },
]

async function generateAll() {
  const profile = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../ai-career-assistant-1786020087673.json"), "utf8")
  )
  const appDir = path.join(__dirname, "../applications")
  if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true })

  for (const t of targets) {
    const session = profile.messagesBySessionId[t.sessionId]
    if (!session || !session[t.index]) continue
    const text = session[t.index].parts[0].text

    const cvMatch = text.match(/```component:cv\n([\s\S]*?)\n```/)
    const clMatch = text.match(/```component:coverLetter\n([\s\S]*?)\n```/)

    if (cvMatch && clMatch) {
      const cvData = JSON.parse(cvMatch[1]).resumeData
      const clData = JSON.parse(clMatch[1])

      // CV PDF
      const sanitizedCV = sanitizeResumeData(cvData)
      const Tpl = getResumeTemplate(t.cvTemplate)
      const cvBuf = await renderToBuffer(createElement(Tpl, { resumeData: sanitizedCV }) as any)
      const cvPath = path.join(appDir, `Lebenslauf_${t.company}.pdf`)
      fs.writeFileSync(cvPath, cvBuf)

      // Cover Letter PDF
      const clBuf = await generateCoverLetterPDFBuffer(clData, t.clTemplate as any)
      const clPath = path.join(appDir, `Anschreiben_${t.company}.pdf`)
      fs.writeFileSync(clPath, clBuf)

      console.log(`Successfully compiled application package for ${t.company}:`)
      console.log(`  Resume: ${cvPath} (${cvBuf.length} bytes)`)
      console.log(`  Cover Letter: ${clPath} (${clBuf.length} bytes)`)
    }
  }
}

generateAll().catch(console.error)
