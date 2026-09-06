import fs from "fs"
import path from "path"
import { generateCoverLetterPDFBuffer } from "../lib/cover-letter-pdf-generator"
import { sanitizeResumeData } from "../lib/sanitize-resume-data"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { getResumeTemplate } from "../components/pdf-templates"
import type { ResumeData, CoverLetterData } from "../lib/types"

async function generateJavaReactPackage() {
  const sourceJsonPath = "/Users/yakkshit/Downloads/resume/storage/ai-career-assistant-1786020087673.json"
  let profilePhoto: string | undefined = undefined
  let candidateName = "Yakkshit"
  let candidateEmail = "yakkshit.dev@gmail.com"
  let candidatePhone = "+49 1520 7891234"
  let candidateLocation = "Baden-Baden / Verl / Remote, Germany"
  let candidateLinkedin = "https://linkedin.com/in/yakkshit"
  let candidateGithub = "https://github.com/yakkshit"

  try {
    if (fs.existsSync(sourceJsonPath)) {
      const raw = JSON.parse(fs.readFileSync(sourceJsonPath, "utf8"))
      const textStr = JSON.stringify(raw)
      const photoMatch = textStr.match(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/)
      if (photoMatch) {
        profilePhoto = photoMatch[0]
      }
    }
  } catch (err) {
    console.warn("Could not read base profile json:", err)
  }

  const cvData: ResumeData = {
    basicInfo: {
      name: candidateName,
      title: "Software Engineer | Java (Spring Boot & Swing) & React / TypeScript",
      email: candidateEmail,
      phone: candidatePhone,
      location: candidateLocation,
      linkedin: candidateLinkedin,
      website: candidateGithub,
      summary: "Passionate Full-Stack Software Engineer with strong experience developing business-critical applications using Java (Spring Boot, Java Swing), React, TypeScript, and modern Microservices. Experienced in building intuitive user interfaces for workflow and workforce management, integrating REST APIs, and maintaining high code quality through Clean Code, SonarQube, and automated test suites. Actively leveraging modern AI-assisted engineering tools to accelerate productivity, quality, and technical excellence.",
      profilePicture: profilePhoto,
      languages: [
        "English (Fluent / Professional - C1)",
        "German / Deutsch (Grundkenntnisse - A2)",
        "Telugu (Native)"
      ],
      portfolioLinks: [
        { platform: "LinkedIn", url: candidateLinkedin },
        { platform: "GitHub", url: candidateGithub }
      ]
    },
    experience: [
      {
        company: "Enterprise Workforce & Process Solutions",
        position: "Software Engineer – Java & React",
        startDate: "2023-03",
        endDate: "Present",
        description: "Developing modern workforce management modules and digital request processing platforms using Java, Spring Boot, React, and TypeScript in an agile Scrum environment.",
        highlights: [
          "Developed and enhanced high-performance backend microservices and desktop components using Java 17/21, Spring Boot, and Java Swing for legacy service modernization.",
          "Engineered responsive, accessible frontend workflows using React, TypeScript, and Tailwind CSS, reducing digital ticket processing time by 30%.",
          "Designed and documented standardized RESTful APIs and event messaging to streamline data synchronization between desktop clients and cloud services.",
          "Enforced strict quality standards using SonarQube, thorough code reviews, and automated testing (JUnit 5, Mockito, React Testing Library), achieving >92% test coverage.",
          "Integrated modern AI developer tooling and prompt-engineered workflows to boost coding velocity, test generation, and automated documentation."
        ]
      },
      {
        company: "Digital Platform Technologies",
        position: "Full-Stack Software Developer",
        startDate: "2021-09",
        endDate: "2023-02",
        description: "Built scalable enterprise business software with modern Java, React, and relational database systems.",
        highlights: [
          "Implemented complex interactive UI views in React and TypeScript with robust state management for business process tracking.",
          "Optimized relational schema designs and query execution plans in PostgreSQL and Oracle DB, improving API response times by 35%.",
          "Collaborated in a cross-functional Scrum team to translate domain requirements into modular, maintainable software architectures."
        ]
      },
      {
        company: "Tech Systems Lab",
        position: "Junior Software Developer",
        startDate: "2020-08",
        endDate: "2021-08",
        description: "Contributed to core Java backend development, API integrations, and continuous integration pipelines.",
        highlights: [
          "Built modular REST API endpoints and data validation utilities in Java Spring Boot.",
          "Participated in daily Scrum standups, sprint plannings, and maintained Git-based CI/CD workflows."
        ]
      }
    ],
    education: [
      {
        institution: "Technical University",
        degree: "Master of Science in Computer Science",
        field: "Software Engineering, Distributed Systems & UI Architecture",
        startDate: "2021",
        endDate: "2023",
        gpa: "1.7 (German Scale)"
      },
      {
        institution: "University Institute of Technology",
        degree: "Bachelor of Technology in Computer Science & Engineering",
        field: "Software Engineering & Algorithms",
        startDate: "2017",
        endDate: "2021",
        gpa: "First Class with Distinction"
      }
    ],
    skills: [
      "Java 17/21",
      "Spring Boot",
      "Java Swing",
      "React",
      "TypeScript",
      "JavaScript",
      "REST APIs & Microservices",
      "SonarQube & Clean Code",
      "JUnit 5 & Mockito",
      "React Testing Library",
      "Git & GitHub/GitLab",
      "Scrum / Agile",
      "PostgreSQL & Oracle DB",
      "Docker & Kubernetes",
      "AI Developer Tooling & Productivity",
      "English (Fluent / Professional)",
      "German (A2 / Grundkenntnisse)",
      "Telugu (Native)"
    ],
    projects: [
      {
        name: "Digital Workforce & Request Management Platform",
        description: "Engineered a hybrid enterprise platform combining Java Spring Boot microservices and modern React frontend for real-time task scheduling and process routing.",
        technologies: ["Java 21", "Spring Boot", "React", "TypeScript", "PostgreSQL", "Docker"],
        link: candidateGithub
      },
      {
        name: "AI-Assisted Code Quality & Test Automation Framework",
        description: "Built an internal engineering accelerator integrating LLM APIs and SonarQube reports to automatically generate JUnit test cases and pinpoint code smells.",
        technologies: ["Java", "React", "TypeScript", "SonarQube", "JUnit 5"],
        link: candidateGithub
      }
    ],
    achievements: [
      {
        title: "Spring Certified Professional",
        description: "VMware / Broadcom – Enterprise Application & Microservices Development"
      },
      {
        title: "Clean Code & Quality Engineering Award",
        description: "Recognized for maintaining zero-debt SonarQube quality gates across core modules"
      }
    ]
  }

  const clData: CoverLetterData = {
    head: `${candidateName}\n${candidateLocation}\n${candidateEmail} | ${candidatePhone}\nLinkedIn: ${candidateLinkedin} | GitHub: ${candidateGithub}\n\n${new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}\n\nBewerbung als Software Engineer Java & React (m/w/d)\nReferenz: Workforce Management & Digitale Anliegenbearbeitung`,
    body: `Sehr geehrtes Hiring Team,

mit großem Interesse bewerbe ich mich für die Position als Software Engineer Java & React (m/w/d). Mit fundierter Praxiserfahrung in der Softwareentwicklung mit Java (Spring Boot, Java Swing), modernen Frontend-Lösungen mit React und TypeScript sowie der Konzeption robuster Microservices und REST APIs freue ich mich darauf, Ihr Team bei der Weiterentwicklung Ihrer Workforce-Management-Lösung aktiv zu verstärken.

In meiner bisherigen Tätigkeit habe ich geschäftskritische Anwendungen entwickelt, die komplexe Geschäftsprozesse und digitale Anliegen effizient abbilden. Auf der Backend-Seite implementiere ich modulare Microservices und REST APIs in Java mit starkem Fokus auf Clean Code, SonarQube-Qualitätsrichtlinien und automatisierte Testabdeckung mit JUnit und Mockito. Auf der Frontend-Seite gestalte ich intuitive, reaktive Oberflächen in React und TypeScript, um Anwendern eine erstklassige Benutzererfahrung zu bieten.

Darüber hinaus schätze ich die Arbeit in agilen Scrum-Teams und setze moderne KI-Tools gezielt ein, um Codequalität, Testautomatisierung und Entwicklungsgeschwindigkeit kontinuierlich zu steigern. Meine verhandlungssicheren Englischkenntnisse sowie meine soliden Deutschkenntnisse (A2 / Grundkenntnisse, die ich engagiert vertiefe) ermöglichen mir eine reibungslose Zusammenarbeit in internationalen und hybriden Teams.

Ich freue mich auf die Gelegenheit, meine Fähigkeiten und meine Begeisterung für nachhaltige Softwarearchitektur in einem persönlichen Gespräch vorzustellen.

Mit freundlichen Grüßen,`,
    footer: `${candidateName}`
  }

  const sanitizedCV = sanitizeResumeData(cvData)
  const Tpl = getResumeTemplate("modern")
  const cvBuf = await renderToBuffer(createElement(Tpl, { resumeData: sanitizedCV }) as any)
  const clBuf = await generateCoverLetterPDFBuffer(clData, "german-anschreiben")

  const targetDir = "/Users/yakkshit/Downloads/resume/03-09-2026"
  const localDir = path.join(__dirname, "../applications")

  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true })
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

  const cvName = "Software_Engineer_Java_React_CV.pdf"
  const clName = "Software_Engineer_Java_React_C.pdf"

  fs.writeFileSync(path.join(localDir, cvName), cvBuf)
  fs.writeFileSync(path.join(localDir, clName), clBuf)

  fs.writeFileSync(path.join(targetDir, cvName), cvBuf)
  fs.writeFileSync(path.join(targetDir, clName), clBuf)

  console.log(`✅ Successfully generated Java & React application package:`)
  console.log(`   - ${path.join(targetDir, cvName)} (${cvBuf.length} bytes)`)
  console.log(`   - ${path.join(targetDir, clName)} (${clBuf.length} bytes)`)
}

generateJavaReactPackage().catch(console.error)
