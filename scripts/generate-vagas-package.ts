import fs from "fs"
import path from "path"
import { generateCoverLetterPDFBuffer } from "../lib/cover-letter-pdf-generator"
import { sanitizeResumeData } from "../lib/sanitize-resume-data"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { getResumeTemplate } from "../components/pdf-templates"
import type { ResumeData, CoverLetterData } from "../lib/types"

async function generateVagasPackage() {
  const sourceJsonPath = "/Users/yakkshit/Downloads/resume/storage/ai-career-assistant-1786020087673.json"
  let profilePhoto: string | undefined = undefined
  let candidateName = "Yakkshit"
  let candidateEmail = "yakkshit.dev@gmail.com"
  let candidatePhone = "+49 1520 7891234"
  let candidateLocation = "Konstanz, Germany / Remote"
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
      title: "Senior Fullstack Python Developer | FastAPI, React & Cloud Architectures",
      email: candidateEmail,
      phone: candidatePhone,
      location: candidateLocation,
      linkedin: candidateLinkedin,
      website: candidateGithub,
      summary: "Senior Fullstack Python Developer with extensive experience architecting high-performance web applications, scalable REST/GraphQL APIs, and reactive frontend architectures. Highly proficient in Python web frameworks (FastAPI, Django, Flask) paired with modern React/TypeScript ecosystems, PostgreSQL/SQLAlchemy, and cloud-native AWS infrastructures. Adept at driving technical roadmaps, optimizing system performance, and mentoring cross-functional engineering teams.",
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
        company: "Cedzlabs",
        position: "Lead Fullstack & AI Engineer",
        startDate: "2022-06",
        endDate: "Present",
        description: "Leading technical strategy, full-stack architecture, and production deployments for high-throughput AI and cloud SaaS platforms.",
        highlights: [
          "Architected and deployed production-grade FastAPI and Python backend microservices handling streaming inference and low-latency API workloads.",
          "Built responsive, accessible web applications using React, Next.js, and TypeScript with optimized state management and server-side rendering.",
          "Implemented database models with PostgreSQL, SQLAlchemy, and Redis caching, cutting database response times by 40% under peak concurrency.",
          "Orchestrated Docker container deployments and CI/CD automation on AWS, ensuring 99.9% service reliability and zero-downtime releases.",
          "Mentored junior developers on system design patterns, clean coding standards, comprehensive unit/integration testing (PyTest, Jest), and code reviews."
        ]
      },
      {
        company: "Circleup AG",
        position: "Lead Full-Stack Developer",
        startDate: "2023-12",
        endDate: "2024-12",
        description: "Directed system architecture, microservices migration, and automated calculation pipelines for enterprise circular economy platforms.",
        highlights: [
          "Led the transition of monolithic services to modular microservices with Python (FastAPI/Flask), Node.js, and PostgreSQL.",
          "Automated complex calculation logic and data processing via custom Python engines, reducing batch execution times by 45%.",
          "Established automated CI/CD deployment pipelines on AWS and implemented robust code quality standards across the engineering team."
        ]
      },
      {
        company: "Nutrish.ai",
        position: "Software Developer Intern – Fullstack & AI",
        startDate: "2025-01",
        endDate: "2025-07",
        description: "Developed AI-driven web applications and predictive backend services with Python, Next.js, and PostgreSQL.",
        highlights: [
          "Designed and consumed high-performance RESTful APIs integrating vector databases and relational data layers.",
          "Implemented automated test suites and structured database migrations using Drizzle ORM and PostgreSQL."
        ]
      },
      {
        company: "University of Konstanz",
        position: "Research Assistant – Distributed Systems & Python",
        startDate: "2026-02",
        endDate: "Present",
        description: "Engineering decentralized algorithms, high-concurrency event loops, and data pipelines in Python and C++.",
        highlights: [
          "Developed real-time distributed communication pipelines and simulated complex multi-agent interactions."
        ]
      }
    ],
    education: [
      {
        institution: "Universität Konstanz",
        degree: "Master of Science in Computer and Information Science",
        field: "Distributed Systems, Machine Learning & Software Architecture",
        startDate: "2025-04",
        endDate: "Present",
        gpa: "Current Studies"
      },
      {
        institution: "JNTU Kakinada & Blekinge Institute of Technology (BTH)",
        degree: "Bachelor of Science in Computer Science",
        field: "Software Engineering & Distributed Web Architectures",
        startDate: "2020-08",
        endDate: "2024-06",
        gpa: "First Class with Distinction"
      }
    ],
    skills: [
      "Python (FastAPI, Django, Flask)",
      "TypeScript & JavaScript",
      "React & Next.js",
      "RESTful APIs & GraphQL",
      "PostgreSQL & MySQL",
      "SQLAlchemy & Drizzle ORM",
      "AWS (ECS, S3, RDS, Lambda)",
      "Docker & Kubernetes",
      "CI/CD (GitHub Actions, GitLab)",
      "PyTest & Jest / RTL",
      "Redis & Caching",
      "System Design & Scalability",
      "Git & Code Reviews",
      "English (Fluent / Professional)",
      "German (A2 / Grundkenntnisse)",
      "Telugu (Native)"
    ],
    projects: [
      {
        name: "Cloud-Native AI SaaS & Microservice API Engine",
        description: "Engineered an end-to-end cloud platform featuring a persistent FastAPI backend, Redis queue, and React/Next.js frontend with real-time streaming.",
        technologies: ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker", "AWS"],
        link: candidateGithub
      },
      {
        name: "AI-Powered Semantic Search & Career Platform",
        description: "Built a full-stack platform leveraging Python APIs, vector embeddings, and React to match candidate profiles with job requisitions via semantic matching.",
        technologies: ["Python", "React", "Next.js", "PostgreSQL", "Redis", "Docker"],
        link: candidateGithub
      }
    ],
    achievements: [
      {
        title: "AWS Cloud Architecture & Scalability",
        description: "Proven expertise in deploying containerized microservices and automated CI/CD workflows on AWS"
      },
      {
        title: "Engineering Leadership & Mentorship",
        description: "Track record of mentoring developers, setting testing standards, and leading microservice architecture transitions"
      }
    ]
  }

  const clData: CoverLetterData = {
    head: `${candidateName}\n${candidateLocation}\n${candidateEmail} | ${candidatePhone}\nLinkedIn: ${candidateLinkedin} | GitHub: ${candidateGithub}\n\n${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n\nVagas.sc\nHiring Team – Engineering\n\nSubject: Application for Senior Fullstack Python Developer (Vagas.sc)`,
    body: `Dear Hiring Team at Vagas.sc,

I am writing to express my enthusiasm for the Senior Fullstack Python Developer position at Vagas.sc. With extensive experience in architecting scalable Python backend web applications (FastAPI, Django, Flask), building modern reactive user interfaces with React and TypeScript, and orchestrating robust cloud deployments on AWS, I am excited by the opportunity to help elevate Vagas.sc’s platform performance and user experience.

Throughout my career as a lead fullstack engineer and technical founder, I have owned products from technical design through production deployment. I have engineered high-throughput RESTful and GraphQL APIs, optimized complex relational database schemas using PostgreSQL and SQLAlchemy, and implemented Redis caching to eliminate performance bottlenecks. On the frontend, I craft intuitive, accessible user interfaces with React, Next.js, and TypeScript, ensuring seamless end-to-end integration and responsive design.

Beyond individual technical contributions, I place high value on engineering excellence and team collaboration. I actively participate in architecture planning, establish robust CI/CD pipelines and automated testing practices with PyTest and Jest, and mentor fellow engineers through constructive code reviews. Communicating fluently in professional English (with conversational German A2), I excel in cross-functional, distributed teams where product ownership, speed, and code quality are essential.

Vagas.sc’s mission and technical challenges align perfectly with my fullstack expertise and enthusiasm for scalable systems. I welcome the opportunity to discuss in an interview how my Python, React, and cloud architecture skills can support your engineering roadmap.

Thank you for your time and consideration.`,
    footer: `Sincerely,\n\n${candidateName}`
  }

  const sanitizedCV = sanitizeResumeData(cvData)
  const Tpl = getResumeTemplate("modern")
  const cvBuf = await renderToBuffer(createElement(Tpl, { resumeData: sanitizedCV }) as any)
  const clBuf = await generateCoverLetterPDFBuffer(clData, "modern")

  const targetDir = "/Users/yakkshit/Downloads/resume/03-09-2026"
  const localDir = path.join(__dirname, "../applications")

  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true })
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

  const cvName = "Vagas_Senior_Fullstack_Python_CV.pdf"
  const clName = "Vagas_Senior_Fullstack_Python_C.pdf"

  fs.writeFileSync(path.join(localDir, cvName), cvBuf)
  fs.writeFileSync(path.join(localDir, clName), clBuf)

  fs.writeFileSync(path.join(targetDir, cvName), cvBuf)
  fs.writeFileSync(path.join(targetDir, clName), clBuf)

  console.log(`✅ Successfully generated Vagas.sc application package:`)
  console.log(`   - ${path.join(targetDir, cvName)} (${cvBuf.length} bytes)`)
  console.log(`   - ${path.join(targetDir, clName)} (${clBuf.length} bytes)`)
}

generateVagasPackage().catch(console.error)
