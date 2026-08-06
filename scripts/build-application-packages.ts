import fs from "fs"
import path from "path"
import { generateCoverLetterPDFBuffer } from "../lib/cover-letter-pdf-generator"
import { sanitizeResumeData } from "../lib/sanitize-resume-data"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { getResumeTemplate } from "../components/pdf-templates"

const profileData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../ai-career-assistant-1786020087673.json"), "utf8")
)

async function generateAllPackages() {
  const appDir = path.join(__dirname, "../applications")
  if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true })

  console.log("Generating application packages...")

  // Generate ArborSort AI package
  const arborSession = profileData.messagesBySessionId["1784745083178"]
  if (arborSession) {
    const cvPart = arborSession[1]?.parts[0]?.text
    if (cvPart) {
      const cvMatch = cvPart.match(/```component:cv\n([\s\S]*?)\n```/)
      const clMatch = cvPart.match(/```component:coverLetter\n([\s\S]*?)\n```/)

      if (cvMatch && clMatch) {
        const cvData = JSON.parse(cvMatch[1]).resumeData
        const clData = JSON.parse(clMatch[1])

        const sanitizedCV = sanitizeResumeData(cvData)
        const Tpl = getResumeTemplate("german-modern")
        const cvBuf = await renderToBuffer(createElement(Tpl, { resumeData: sanitizedCV }) as any)
        fs.writeFileSync(path.join(appDir, "Lebenslauf_ArborSort_AI.pdf"), cvBuf)

        const clBuf = await generateCoverLetterPDFBuffer(clData, "german-anschreiben")
        fs.writeFileSync(path.join(appDir, "Anschreiben_ArborSort_AI.pdf"), clBuf)

        console.log("Generated ArborSort AI application package!")
      }
    }

    const underwaterPart = arborSession[3]?.parts[0]?.text
    if (underwaterPart) {
      const cvMatch = underwaterPart.match(/```component:cv\n([\s\S]*?)\n```/)
      const clMatch = underwaterPart.match(/```component:coverLetter\n([\s\S]*?)\n```/)

      if (cvMatch && clMatch) {
        const cvData = JSON.parse(cvMatch[1]).resumeData
        const clData = JSON.parse(clMatch[1])

        const sanitizedCV = sanitizeResumeData(cvData)
        const Tpl = getResumeTemplate("german-modern")
        const cvBuf = await renderToBuffer(createElement(Tpl, { resumeData: sanitizedCV }) as any)
        fs.writeFileSync(path.join(appDir, "Lebenslauf_Underwater_AI.pdf"), cvBuf)

        const clBuf = await generateCoverLetterPDFBuffer(clData, "german-anschreiben")
        fs.writeFileSync(path.join(appDir, "Anschreiben_Underwater_AI.pdf"), clBuf)

        console.log("Generated Underwater AI application package!")
      }
    }
  }
}

generateAllPackages().catch(console.error)
