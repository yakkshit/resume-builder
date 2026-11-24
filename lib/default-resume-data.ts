import type { ResumeData } from "./types"

export const defaultResumeData: ResumeData = {
  language: "en",
  basicInfo: {
    name: "Alex Morgan",
    title: "Full-Stack & Cloud Systems Engineer",
    email: "alex.morgan@example.com",
    phone: "+49 151 23456789",
    location: "Berlin, Germany",
    linkedin: "https://linkedin.com/in/alex-morgan-sample",
    website: "https://github.com/alex-morgan-sample",
    summary:
      "Full-Stack & Cloud Systems Engineer with practical experience designing scalable distributed web platforms, containerized microservices, and automated CI/CD pipelines. Proficient in TypeScript, React, Next.js, Python, Docker, AWS, and modern API architectures.",
    profilePicture: "/api/avatar/default-user",
    languages: ["English (Fluent / C1+)", "German (Professional / B2)"],
    portfolioLinks: [
      {
        platform: "GitHub",
        url: "https://github.com/alex-morgan-sample",
        username: "alex-morgan-sample",
      },
    ],
  },
  experience: [
    {
      company: "CloudScale Technologies",
      position: "Full-Stack & DevOps Engineer",
      startDate: "2024",
      endDate: "Present",
      description:
        "Architecting scalable web applications and cloud infrastructure with containerized environments and automated deployment pipelines.",
      highlights: [
        "Led engineering of modular web applications using TypeScript, React, Next.js, and Python microservices.",
        "Implemented automated CI/CD workflows with GitHub Actions, reducing release cycles and maintaining 99.9% uptime.",
        "Deployed high-availability cloud services on AWS with Docker containers and Prometheus monitoring.",
      ],
    },
    {
      company: "Apex Software Labs",
      position: "Software Engineer",
      startDate: "2022",
      endDate: "2024",
      description:
        "Engineered RESTful backend services, APIs, and modern responsive user interfaces for SaaS web applications.",
      highlights: [
        "Built and maintained scalable REST APIs and relational database schemas with MySQL and PostgreSQL.",
        "Developed reusable front-end component libraries and interactive dashboards in React and TypeScript.",
        "Standardized unit and integration testing pipelines to safeguard code quality across production releases.",
      ],
    },
    {
      company: "Digital Core AG",
      position: "Junior Developer",
      startDate: "2021",
      endDate: "2022",
      description:
        "Contributed to full-stack feature development, API integration, and database maintenance in an agile team.",
      highlights: [
        "Assisted in migrating legacy services to modern containerized microservices using Docker.",
        "Collaborated on frontend UI enhancements and cross-browser testing for customer-facing web apps.",
      ],
    },
  ],
  education: [
    {
      institution: "Technical University of Munich, Germany",
      degree: "M.Sc., Computer Science",
      field: "Focus: Distributed Systems & Software Architecture",
      startDate: "2022",
      endDate: "2024",
      gpa: "",
    },
    {
      institution: "University of Applied Sciences Berlin, Germany",
      degree: "B.Sc., Software Engineering",
      field: "Computer Science and Software Engineering",
      startDate: "2018",
      endDate: "2022",
      gpa: "",
    },
  ],
  skills: [
    "TypeScript & JavaScript",
    "React & Next.js",
    "Python",
    "Node.js",
    "AWS & Cloud Computing",
    "Docker & Docker Compose",
    "Kubernetes",
    "PostgreSQL & MySQL",
    "Linux & Bash Scripting",
    "CI/CD & GitHub Actions",
    "APIs (REST, GraphQL, MCP)",
    "Terraform & Infrastructure as Code",
    "Prometheus & Grafana",
    "Software Architecture & Design",
  ],
  projects: [
    {
      name: "Cloud Platform Orchestrator",
      description:
        "Microservices management and deployment dashboard enabling automated container orchestration and real-time telemetry.",
      technologies: ["TypeScript", "Next.js", "Docker", "AWS", "FastAPI"],
      link: "https://github.com/alex-morgan-sample/orchestrator",
      startDate: "2024",
      endDate: "Present",
    },
    {
      name: "Autonomous Agent Tooling Suite",
      description:
        "Open-source workflow automation and Model Context Protocol server suite for developer tools.",
      technologies: ["Python", "TypeScript", "MCP", "Docker"],
      link: "https://github.com/alex-morgan-sample/mcp-suite",
      startDate: "2023",
      endDate: "2024",
    },
  ],
  achievements: [
    {
      title: "Open Source Contributor",
      description: "Active contributor to cloud-native developer tooling and modern web frameworks.",
      date: "Present",
    },
  ],
}
