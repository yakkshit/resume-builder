import type { ResumeData } from "./types"

export const defaultResumeData: ResumeData = {
  basicInfo: {
    name: "Alex Johnson",
    title: "Senior Software Engineer",
    email: "alex.johnson@example.com",
    phone: "(555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "alexjohnson",
    website: "alexjohnson.dev",
    summary:
      "Experienced software engineer with 8+ years of expertise in building scalable web applications. Passionate about clean code, performance optimization, and creating exceptional user experiences.",
    languages: ["English (Native)", "Spanish (Fluent)", "French (Basic)"],
    portfolioLinks: [
      {
        platform: "GitHub",
        url: "https://github.com/alexjohnson",
        username: "alexjohnson",
      },
      {
        platform: "Dribbble",
        url: "https://dribbble.com/alexjohnson",
        username: "alexjohnson",
      },
    ],
  },
  experience: [
    {
      company: "Tech Innovations Inc.",
      position: "Senior Software Engineer",
      startDate: "01/2020",
      endDate: "Present",
      description:
        "Lead developer for the company's flagship product, improving performance by 40%. Mentored junior developers and implemented CI/CD pipelines that reduced deployment time by 60%.",
      highlights: [],
    },
    {
      company: "WebSolutions Co.",
      position: "Software Engineer",
      startDate: "03/2017",
      endDate: "12/2019",
      description:
        "Developed and maintained multiple client-facing applications using React and Node.js. Collaborated with design team to implement responsive UI components.",
      highlights: [],
    },
    {
      company: "StartupXYZ",
      position: "Junior Developer",
      startDate: "06/2015",
      endDate: "02/2017",
      description: "Assisted in building the company's MVP. Implemented features that helped secure Series A funding.",
      highlights: [],
    },
  ],
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "Master of Science",
      field: "Computer Science",
      startDate: "08/2013",
      endDate: "05/2015",
      gpa: "3.8",
    },
    {
      institution: "Stanford University",
      degree: "Bachelor of Science",
      field: "Software Engineering",
      startDate: "08/2009",
      endDate: "05/2013",
      gpa: "3.7",
    },
  ],
  skills: [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "GraphQL",
    "AWS",
    "Docker",
    "CI/CD",
    "Agile Methodologies",
    "System Design",
    "Performance Optimization",
  ],
  projects: [
    {
      name: "E-commerce Platform",
      description:
        "Developed a full-stack e-commerce platform with React, Node.js, and MongoDB. Implemented payment processing, inventory management, and user authentication.",
      technologies: ["React", "Node.js", "MongoDB", "Stripe API"],
      link: "https://github.com/alexjohnson/ecommerce",
      startDate: "06/2019",
      endDate: "12/2019",
    },
    {
      name: "Task Management App",
      description:
        "Built a collaborative task management application with real-time updates using Socket.io. Features include task assignment, deadline tracking, and progress visualization.",
      technologies: ["React", "Express", "Socket.io", "PostgreSQL"],
      link: "https://taskmaster.example.com",
      startDate: "02/2018",
      endDate: "05/2018",
    },
  ],
  achievements: [
    {
      title: "Innovation Award",
      description:
        "Received company-wide recognition for developing an automated testing framework that reduced QA time by 35%.",
      date: "2021",
    },
    {
      title: "Conference Speaker",
      description: "Presented 'Scaling React Applications' at ReactConf, with over 500 attendees.",
      date: "2019",
    },
    {
      title: "Open Source Contributor",
      description: "Active contributor to several popular open-source projects with over 50 accepted pull requests.",
      date: "2018-Present",
    },
  ],
}
