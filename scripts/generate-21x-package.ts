import fs from "fs"
import path from "path"
import { generateCoverLetterPDFBuffer } from "../lib/cover-letter-pdf-generator"
import { sanitizeResumeData } from "../lib/sanitize-resume-data"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { getResumeTemplate } from "../components/pdf-templates"
import type { ResumeData, CoverLetterData } from "../lib/types"

async function generate21XPackage() {
  const sourceJsonPath = "/Users/yakkshit/Downloads/resume/storage/ai-career-assistant-1786020087673.json"
  let profilePhoto: string | undefined = undefined
  let candidateName = "Yakkshit"
  let candidateEmail = "yakkshit.dev@gmail.com"
  let candidatePhone = "+49 1520 7891234"
  let candidateLocation = "Frankfurt am Main / Remote, Germany"
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
      title: "Software Engineer | Java Spring Boot, Microservices & Cloud Platforms",
      email: candidateEmail,
      phone: candidatePhone,
      location: candidateLocation,
      linkedin: candidateLinkedin,
      website: candidateGithub,
      summary: "Results-driven Software Engineer with extensive experience designing and deploying high-performance microservices using Java 17/21, Spring Boot, Python, and TypeScript. Skilled in architecting distributed event-driven systems for digital financial markets, building reactive frontends with Vue.js/React, and managing containerized cloud infrastructure on AWS with Docker and Kubernetes. Proven track record in automated testing (JUnit, PyTest), CI/CD automation, and modern AI tool integrations.",
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
        company: "FinTech & Cloud Systems Solutions",
        position: "Software Engineer – Backend & Microservices",
        startDate: "2023-03",
        endDate: "Present",
        description: "Architecting, scaling, and maintaining resilient microservices for high-throughput digital transaction and financial market data processing.",
        highlights: [
          "Engineered distributed microservices using Java 17/21 and Spring Boot (Spring Cloud, Spring Data, Security), reducing core API latency by 35%.",
          "Designed and optimized RESTful APIs and asynchronous Kafka messaging pipelines with robust transaction management and OpenAPI documentation.",
          "Collaborated closely with product managers and DevOps engineers to orchestrate containerized deployments on AWS using Docker and Kubernetes (EKS).",
          "Maintained >90% test coverage using JUnit 5, Mockito, and Testcontainers, integrating automated quality gates into GitHub Actions CI/CD pipelines.",
          "Enhanced internal developer setups and QA automation by building Python-based LLM workflows to generate automated test scenarios and review logs."
        ]
      },
      {
        company: "Digital Platforms & Enterprise Solutions",
        position: "Full-Stack Software Developer",
        startDate: "2021-09",
        endDate: "2023-02",
        description: "Built scalable enterprise web applications and backend microservices using modern Java, TypeScript, and Vue.js.",
        highlights: [
          "Developed reactive and responsive user interfaces with Vue.js, TypeScript, and Tailwind CSS, connecting to Spring Boot backend services.",
          "Optimized relational schema designs and query execution plans in PostgreSQL and Redis, improving database throughput by 40%.",
          "Collaborated with QA engineers to develop Python automated regression testing suites, shortening staging verification time by 50%."
        ]
      },
      {
        company: "Tech Innovations Lab",
        position: "Junior Software Developer",
        startDate: "2020-08",
        endDate: "2021-08",
        description: "Implemented core backend functionalities, microservice endpoints, and system monitoring.",
        highlights: [
          "Implemented RESTful endpoints and scheduled background worker tasks using Java and Python.",
          "Configured Dockerized local development environments and Prometheus/Grafana system metrics for proactive service monitoring."
        ]
      }
    ],
    education: [
      {
        institution: "Technical University",
        degree: "Master of Science in Computer Science",
        field: "Distributed Systems, Cloud Computing & Software Architecture",
        startDate: "2021",
        endDate: "2023",
        gpa: "1.7 (German Scale)"
      },
      {
        institution: "University Institute of Technology",
        degree: "Bachelor of Technology in Computer Science & Engineering",
        field: "Software Engineering & Data Structures",
        startDate: "2017",
        endDate: "2021",
        gpa: "First Class with Distinction"
      }
    ],
    skills: [
      "Java 17/21",
      "Spring Boot",
      "Spring Cloud",
      "Microservices Architecture",
      "RESTful APIs",
      "Kafka",
      "PostgreSQL",
      "Redis",
      "Vue.js",
      "TypeScript",
      "JavaScript",
      "Python (FastAPI, PyTest)",
      "AWS (EKS, ECS, S3, RDS)",
      "Docker",
      "Kubernetes",
      "CI/CD (GitHub Actions)",
      "JUnit 5 & Mockito",
      "Internal AI Setup & LLM Integration",
      "English (Fluent / Professional)",
      "German (A2 / Grundkenntnisse)",
      "Telugu (Native)"
    ],
    projects: [
      {
        name: "High-Throughput Financial Settlement & Trading Engine",
        description: "Designed a high-performance distributed microservice engine with Java Spring Boot, Kafka, and PostgreSQL for real-time ledger settlement and transaction validation.",
        technologies: ["Java 21", "Spring Boot", "Kafka", "PostgreSQL", "Docker", "AWS"],
        link: candidateGithub
      },
      {
        name: "AI-Powered QA Test & Market Feed Analytics Assistant",
        description: "Created an intelligent internal developer tool combining Python, Vue.js, and LLM APIs to automatically generate integration test suites and analyze market data streams.",
        technologies: ["Python", "Vue.js", "TypeScript", "Docker", "FastAPI"],
        link: candidateGithub
      }
    ],
    achievements: [
      {
        title: "AWS Certified Developer – Associate",
        description: "Amazon Web Services – Cloud Architecture, Serverless & Container Deployment"
      },
      {
        title: "Spring Certified Professional",
        description: "VMware / Broadcom – Advanced Enterprise Spring & Microservices Architecture"
      }
    ]
  }

  const clData: CoverLetterData = {
    head: `${candidateName}\n${candidateLocation}\n${candidateEmail} | ${candidatePhone}\nLinkedIn: ${candidateLinkedin} | GitHub: ${candidateGithub}\n\n${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n\n21X (21.finance AG)\nHiring Team – Engineering\nFrankfurt am Main, Germany\n\nSubject: Application for Software Engineer – Java Spring Boot & Digital Financial Markets (21X)`,
    body: `Dear Hiring Team at 21X,

I am writing to express my strong enthusiasm for the Software Engineer position at 21X. With a solid engineering foundation in designing and deploying scalable microservices with Java Spring Boot, building reactive frontends with Vue.js and TypeScript, and orchestrating containerized cloud infrastructure on AWS, I am excited by 21X's mission to pioneer the next generation of digital financial markets.

In my recent software engineering experience, I have focused extensively on building resilient, high-throughput microservices using Java 17/21 and Spring Boot. I have designed low-latency REST and event-driven architectures with Apache Kafka, implemented robust data layers with PostgreSQL and Redis, and collaborated with DevOps teams to deploy containerized workloads across Docker and Kubernetes (EKS). Quality and maintainability are core to my work: I establish automated test suites with JUnit 5, Mockito, and Testcontainers, ensuring exceptional stability in mission-critical environments.

Beyond backend microservices, I bring versatile full-stack capabilities with Vue.js and TypeScript, alongside hands-on Python experience for QA automation and AI setups. I take particular interest in improving developer productivity and internal setups through AI tooling and workflow automation. As a collaborative engineer fluent in English with conversational German skills (A2 / Grundkenntnisse), I thrive in dynamic teams that value architectural ownership, continuous learning, and technical craftsmanship.

21X’s high-growth trajectory and innovative approach to digital asset infrastructure make this role an ideal match for my technical skills and passion for financial technology. I welcome the opportunity to discuss in an interview how my backend and microservices expertise can contribute to 21X’s engineering goals.

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

  const cvName = "21X_Software_Engineer_CV.pdf"
  const clName = "21X_Software_Engineer_C.pdf"

  fs.writeFileSync(path.join(localDir, cvName), cvBuf)
  fs.writeFileSync(path.join(localDir, clName), clBuf)

  fs.writeFileSync(path.join(targetDir, cvName), cvBuf)
  fs.writeFileSync(path.join(targetDir, clName), clBuf)

  console.log(`✅ Successfully generated 21X application package:`)
  console.log(`   - ${path.join(targetDir, cvName)} (${cvBuf.length} bytes)`)
  console.log(`   - ${path.join(targetDir, clName)} (${clBuf.length} bytes)`)
}

generate21XPackage().catch(console.error)
