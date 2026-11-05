import type { ResumeData } from "./types"

export const defaultResumeData: ResumeData = {
  language: "en",
  basicInfo: {
    name: "Venkata Sai Yakkshit Reddy Asodi",
    title: "Intern - Software Engineer, Spatial AI Agent Platform (m/f/d)",
    email: "saiyakkshit2001@gmail.com",
    phone: "+49 1713562972",
    location: "Konstanz, Germany",
    linkedin: "https://linkedin.com/in/yakkshit",
    website: "https://github.com/yakkshit",
    summary:
      "Master's student with strong software engineering skills and a passion for advanced AI research, specializing in Spatial AI Agents and multi-modal perception. Proven experience in developing, evaluating, and deploying AI agents, LLMs, and VLMs for complex systems, including video tracking and analysis. Proficient in Python, Deep Learning (PyTorch), software architecture, and rigorous testing, eager to contribute to cutting-edge spatial information technology.",
    profilePicture: "/deepmind-picture-2.jpg",
    languages: ["English (Fluent / C1+)", "German (Basic / A2)"],
    portfolioLinks: [
      {
        platform: "GitHub",
        url: "https://github.com/yakkshit",
        username: "yakkshit",
      },
      {
        platform: "NDE Open Source",
        url: "https://github.com/yakkshit/nde",
        username: "yakkshit",
      },
    ],
  },
  experience: [
    {
      company: "Universität Konstanz",
      position: "Research Assistant / AI Engineer",
      startDate: "2025",
      endDate: "Present",
      description:
        "Conducting advanced research in the Neurobiology department, focusing on complex multi-agent systems for honeybee behavior.",
      highlights: [
        "Designed and implemented complex multi-agent systems in Python and C++ for analyzing honeybee behavior, utilizing Computer Vision and VLMs for video tracking and data acquisition.",
        "Applied rigorous evaluation methods and formal verification to validate theoretical agentic concepts, ensuring system quality, performance, and reliability.",
        "Managed and processed large-scale research data on cloud computing platforms, building robust pipelines for model training and evaluation.",
      ],
    },
    {
      company: "Bodensee Racing Team",
      position: "Autonomous Navigation Engineer",
      startDate: "2026",
      endDate: "Present",
      description:
        "Engineered autonomous navigation stacks for racing hardware, involving complex sensor data and real-time decision-making.",
      highlights: [
        "Developed real-time path planning and decision-making algorithms using ROS2, C++, and Python, integrating multi-sensor fusion for spatial perception.",
        "Implemented sensor fusion across LiDAR, camera, and IMU data streams with low latency telemetry.",
      ],
    },
    {
      company: "Nutrish AI / Swift AI",
      position: "Full-Stack Developer",
      startDate: "2024",
      endDate: "2025",
      description:
        "Developed scalable backend systems, APIs, and modern frontend interfaces for multimodal AI applications.",
      highlights: [
        "Engineered scalable Python backend architectures and RESTful APIs for real-time AI inference and recommendation serving.",
        "Constructed automated data preprocessing pipelines handling large multimodal datasets.",
        "Implemented automated data validation checks and unit/integration test suites to safeguard pipeline reliability.",
      ],
    },
    {
      company: "CircleUp AG",
      position: "Lead Full-Stack Developer",
      startDate: "2023",
      endDate: "2024",
      description:
        "Architected microservices-based web applications with containerized Docker environments and Kubernetes orchestration.",
      highlights: [
        "Led full-stack engineering across modern TypeScript and Python microservices.",
        "Deployed high-availability cloud infrastructure with continuous delivery pipelines.",
      ],
    },
  ],
  education: [
    {
      institution: "Universität Konstanz, Germany",
      degree: "M.Sc. , Computer and Information Science",
      field: "Focus: Agentic AI, Collective Robotics, Formal Verification",
      startDate: "Graduating",
      endDate: "Present",
      gpa: "",
    },
    {
      institution: "JNTU Kakinada & Blekinge Institute of Technology (Sweden)",
      degree: "B.Sc. , Computer Science",
      field: "Computer Science and Software Engineering",
      startDate: "Graduating",
      endDate: "2022",
      gpa: "",
    },
  ],
  skills: [
    "Python",
    "C++",
    "Software Architecture & Design",
    "AI Agents & Orchestration",
    "LLMs & VLMs (Vision-Language Models)",
    "Deep Learning (PyTorch)",
    "Multimodal & Fusion Perception",
    "Spatial Computing",
    "World Models & Embodied AI",
    "Computer Vision",
    "Machine Learning",
    "Model Evaluation & Testing",
    "Data Pipelines",
    "APIs (FastAPI, REST)",
    "Docker",
    "ROS2 / Robotics",
    "Gazebo / Webots Simulation",
    "Formal Verification",
    "Cloud Computing",
    "Technical Communication",
  ],
  projects: [
    {
      name: "Spatial AI Multi-Agent Perception Stack",
      description:
        "Engineered multi-agent perception and collective robotics algorithms with vision-language models for spatial tracking and behavioural modeling.",
      technologies: ["Python", "PyTorch", "ROS2", "OpenCV", "FastAPI"],
      link: "https://github.com/yakkshit/nde",
      startDate: "2025",
      endDate: "Present",
    },
    {
      name: "Autonomous Racing Navigation & SLAM Pipeline",
      description:
        "Real-time sensor fusion combining LiDAR, stereoscopic vision, and IMU data for high-speed trajectory planning and vehicle state estimation.",
      technologies: ["C++", "ROS2", "Sensor Fusion", "Linux", "Docker"],
      link: "https://github.com/yakkshit",
      startDate: "2025",
      endDate: "Present",
    },
  ],
  achievements: [
    {
      title: "Open Source Maintainer",
      description: "Creator and maintainer of spatial intelligence and open-source tooling on GitHub.",
      date: "Present",
    },
    {
      title: "Bodensee Formula Student Racing",
      description: "Engineered autonomous hardware-in-the-loop navigation systems for high-speed racing prototypes.",
      date: "2026",
    },
  ],
}
