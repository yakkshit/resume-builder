import fs from "fs"
import path from "path"
import { sanitizeResumeData } from "../lib/sanitize-resume-data"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import { getResumeTemplate } from "../components/pdf-templates"
import type { ResumeData } from "../lib/types"

async function generateMasterProfileCV() {
  const sourceJsonPath = "/Users/yakkshit/Downloads/resume/storage/ai-career-assistant-1786020087673.json"
  let profilePhoto: string | undefined = undefined
  let candidateName = "Yakkshit"
  let candidateEmail = "yakkshit.dev@gmail.com"
  let candidatePhone = "+49 1520 7891234"
  let candidateLocation = "Konstanz / Baden-Württemberg, Germany"
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
      title: "AI & Robotics Engineer | Full-Stack & Autonomous Systems Specialist",
      email: candidateEmail,
      phone: candidatePhone,
      location: candidateLocation,
      linkedin: candidateLinkedin,
      website: candidateGithub,
      summary: "Versatile AI/Robotics Engineer and Full-Stack Developer with a solid foundation in autonomous systems, multi-agent swarm robotics, and scalable cloud architectures. Experienced in designing real-time perception/control pipelines in C++ and Python (ROS/ROS2), deploying production RAG and AI agent systems with LangChain, and fine-tuning open-source LLMs (Qwen, Llama). Proven leadership in bridging cutting-edge robotics hardware with modern web and AI applications.",
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
        company: "University of Konstanz",
        position: "Research Assistant – Swarm Robotics & Multi-Agent Systems",
        startDate: "2026-02",
        endDate: "Present",
        description: "Researching robotic clusters, swarm intelligence, and emergent decentralized multi-agent behaviors under a global Research Excellence initiative.",
        highlights: [
          "Architecting 'Emergent Orchestras', a modular framework for musical robot swarms in decentralized multi-agent environments.",
          "Engineering perception and control pipelines in Python, C++, and ROS/ROS2, simulating swarm dynamics in Gazebo and Webots.",
          "Translating theoretical multi-agent coordination models into robust real-world physical actuation and embedded control."
        ]
      },
      {
        company: "BRT (Bodensee Racing Team - Formula Student)",
        position: "Autonomous Navigation & Perception Engineer",
        startDate: "2025-08",
        endDate: "Present",
        description: "Developing autonomous perception, obstacle avoidance, and path-planning systems for the Formula Student driverless racecar.",
        highlights: [
          "Implemented low-latency path-planning and obstacle avoidance algorithms in real-time C++ within high-fidelity simulation environments.",
          "Integrated LiDAR, cameras, and IMU sensor fusion in ROS for precise vehicle localization and track boundary mapping.",
          "Collaborated closely with mechanical and electrical engineering teams on hardware-level compute and latency constraints."
        ]
      },
      {
        company: "Nutrish.ai",
        position: "Software Developer Intern – AI & Full-Stack",
        startDate: "2025-01",
        endDate: "2025-07",
        description: "Engineered an AI-driven personal nutrition agent leveraging predictive modeling and Retrieval-Augmented Generation.",
        highlights: [
          "Architected scalable backend services with Next.js, LangChain, Drizzle ORM, and PostgreSQL with Vector search.",
          "Implemented multi-step RAG pipelines grounding AI recommendations in verified nutritional research datasets.",
          "Built high-performance RESTful APIs and real-time streaming interfaces for seamless mobile and web interaction."
        ]
      },
      {
        company: "Circleup AG",
        position: "Lead Full-Stack Developer",
        startDate: "2023-12",
        endDate: "2024-12",
        description: "Led core system architecture, microservices migration, and machine learning model integration for circular economy platforms.",
        highlights: [
          "Directed a developer team migrating monolithic services to scalable microservices with Python, Node.js, Docker, and AWS.",
          "Automated complex lifecycle calculation workflows via custom Python engine templates, reducing processing latency by 45%."
        ]
      },
      {
        company: "Cedzlabs",
        position: "Founder & AI Engineer",
        startDate: "2022-06",
        endDate: "Present",
        description: "Building developer productivity platforms and custom LLM fine-tuning pipelines.",
        highlights: [
          "Fine-tuned open-source LLMs (Qwen2.5) with LoRA/Unsloth and deployed quantized GGUF inference backends on Hugging Face Spaces.",
          "Created AI resume generation and career optimization tools serving global users with real-time streaming."
        ]
      }
    ],
    education: [
      {
        institution: "Universität Konstanz",
        degree: "Master of Science in Computer and Information Science",
        field: "AI for Robotics, Human-Robot Collaboration & Multi-Agent Systems",
        startDate: "2025-04",
        endDate: "Present",
        gpa: "Current Studies"
      },
      {
        institution: "JNTU Kakinada & Blekinge Institute of Technology (BTH)",
        degree: "Bachelor of Science in Computer Science",
        field: "Software Engineering & Spatial Computing (Thesis: ARCore vs WebXR)",
        startDate: "2020-08",
        endDate: "2024-06",
        gpa: "First Class with Distinction"
      }
    ],
    skills: [
      "Python",
      "C++",
      "ROS / ROS2",
      "Gazebo & Webots",
      "Multi-Agent Systems",
      "LLM Fine-Tuning (LoRA/Unsloth)",
      "RAG & LangChain",
      "PyTorch",
      "Computer Vision (OpenCV)",
      "Sensor Fusion (LiDAR/IMU)",
      "Next.js & React",
      "TypeScript & JavaScript",
      "Java & Android SDK",
      "AWS & Docker",
      "PostgreSQL & Vector DBs",
      "Embedded C++ & 3D Prototyping",
      "English (Fluent - C1)",
      "German (A2 / Grundkenntnisse)",
      "Telugu (Native)"
    ],
    projects: [
      {
        name: "Custom AI Resume Generator & Cloud API (Qwen2.5 / Unsloth)",
        description: "Fine-tuned Qwen2.5 models using LoRA/Unsloth, exported to 4-bit GGUF, and deployed an OpenAI-compatible FastAPI backend with streaming PDF rendering.",
        technologies: ["Python", "FastAPI", "Unsloth", "LoRA", "GGUF", "Docker", "Hugging Face"],
        link: candidateGithub
      },
      {
        name: "Full-Stack Agentic Coder (Multi-Agent System)",
        description: "Engineered a multi-agent AI system with specialized planning, coding, and debugging agents utilizing advanced tool-calling and prompt workflows.",
        technologies: ["Python", "LangChain", "Multi-Agent Systems", "Tool-Calling", "LLMs"],
        link: candidateGithub
      },
      {
        name: "Android Multilingual Translator App",
        description: "Developed a native Android mobile application for real-time speech and text translation integrating Google Translate API and offline cache.",
        technologies: ["Java", "Android SDK", "Google Translate API", "Material UI"],
        link: candidateGithub
      },
      {
        name: "ARCore vs WebXR Spatial Computing Benchmarking",
        description: "Benchmarked CPU load, rendering latency, and memory footprint across ARCore and WebXR spatial web frameworks for spatial computing applications.",
        technologies: ["Unity", "ARCore", "WebXR", "Spatial Computing", "C#"],
        link: candidateGithub
      }
    ],
    achievements: [
      {
        title: "Deep Learning Specialization",
        description: "DeepLearning.AI / Coursera – Neural Networks, CNNs & Sequence Models"
      },
      {
        title: "ROS2 & Advanced Autonomous Robotics",
        description: "Comprehensive Navigation Stack, URDF & Sensor Fusion Architecture"
      }
    ]
  }

  const sanitizedCV = sanitizeResumeData(cvData)
  const Tpl = getResumeTemplate("modern")
  const cvBuf = await renderToBuffer(createElement(Tpl, { resumeData: sanitizedCV }) as any)

  const targetDir = "/Users/yakkshit/Downloads/resume/03-09-2026"
  const localDir = path.join(__dirname, "../applications")

  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true })
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

  const cvName = "Master_AI_Robotics_FullStack_CV.pdf"

  fs.writeFileSync(path.join(localDir, cvName), cvBuf)
  fs.writeFileSync(path.join(targetDir, cvName), cvBuf)

  console.log(`✅ Successfully generated Master CV:`)
  console.log(`   - ${path.join(targetDir, cvName)} (${cvBuf.length} bytes)`)
}

generateMasterProfileCV().catch(console.error)
