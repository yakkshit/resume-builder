const React = require("react");
const { createElement: h } = React;
const { renderToFile } = require("@react-pdf/renderer");
const fs = require("fs");
const path = require("path");
const { ResumeDocument, CoverLetterDocument, countPdfPages } = require("./generate-application-pdfs");

const cvData = {
  personalInfo: {
    name: "Venkata Sai Yakkshit Reddy Asodi",
    title: "MLOps Engineer / Cloud & ML Solutions Specialist",
    email: "saiyakkshit2001@gmail.com",
    phone: "+49 1713562972",
    location: "Germany",
    linkedin: "https://linkedin.com/in/yakkshit",
    github: "https://github.com/yakkshit",
    website: "https://yakkshit.com",
  },
  summary:
    "Software & MLOps Engineer with a Master's background in Computer & Information Science (AI/Distributed Systems) and hands-on experience designing scalable cloud infrastructures, containerized ML pipelines (Docker, Kubernetes), and automated CI/CD workflows. Proven track record in orchestrating end-to-end model lifecycles—from data preprocessing and PyTorch/TensorFlow model optimization to automated validation, deployment, and real-time monitoring. Adept at cross-functional collaboration with data scientists, engineers, and enterprise stakeholders.",
  skills: [
    {
      category: "MLOps & Orchestration",
      items: [
        "MLflow",
        "Kubeflow",
        "Apache Airflow",
        "Docker",
        "Kubernetes",
        "CI/CD (GitHub Actions, GitLab CI)",
        "Model Versioning & Monitoring",
      ],
    },
    {
      category: "Cloud & Infrastructure",
      items: [
        "AWS (EC2, S3, Lambda, Cloud Architecture)",
        "GCP / Azure basics",
        "Linux (Advanced)",
        "Bash Scripting",
        "Microservices",
      ],
    },
    {
      category: "Languages & Frameworks",
      items: [
        "Python (FastAPI, Flask, NumPy, Pandas)",
        "C++",
        "PyTorch",
        "TensorFlow",
        "scikit-learn",
        "OpenCV",
        "SQL",
        "TypeScript",
      ],
    },
    {
      category: "DevOps & Quality",
      items: [
        "Automated Testing (pytest, integration suites)",
        "Model Drift & Validation",
        "Git/GitHub/GitLab",
        "Code Reviews",
        "Agile/Scrum",
      ],
    },
  ],
  experiencePage1: [
    {
      position: "Lead Full-Stack & MLOps Developer",
      company: "Circleup AG",
      location: "Germany",
      startDate: "12/2023",
      endDate: "12/2024",
      bullets: [
        "Architected and deployed microservices-based backend systems with containerized Docker environments and Kubernetes orchestration.",
        "Built automated CI/CD pipelines using GitHub Actions and GitLab CI, reducing model deployment lead times and standardizing release cycles.",
        "Integrated production machine learning models and NLP pipelines, implementing automated validation testing, performance logging, and monitoring.",
        "Established rigorous code review workflows and test automation frameworks, ensuring 99.8%+ service uptime across test and production environments.",
      ],
    },
    {
      position: "Software Developer Intern (AI Pipelines & Backend)",
      company: "Nutrish.ai",
      location: "Germany",
      startDate: "01/2025",
      endDate: "07/2025",
      bullets: [
        "Engineered scalable Python backend architectures and RESTful APIs for real-time AI nutrition agent inference and recommendation serving.",
        "Constructed automated data preprocessing and feature engineering pipelines, handling large multimodal datasets with high throughput.",
        "Implemented automated data validation checks and unit/integration test suites to safeguard pipeline reliability and model input integrity.",
        "Collaborated closely with data scientists to optimize model serving latency, memory footprints, and pipeline telemetry.",
      ],
    },
    {
      position: "Research Assistant (AI & Distributed Multi-Agent Systems)",
      company: "University of Konstanz",
      location: "Konstanz, Germany",
      startDate: "02/2026",
      endDate: "Present",
      bullets: [
        "Developed modular, distributed multi-agent frameworks using Python and C++ for decentralized robotic coordination and autonomous decision-making.",
        "Built automated telemetry, real-time logging, and diagnostic pipelines for analyzing high-dimensional system and sensor data from simulations and hardware testbeds.",
        "Authored comprehensive technical documentation, test harnesses, and validation scripts for experimental reproducibility across research teams.",
      ],
    },
  ],
  experiencePage2: [
    {
      position: "Autonomous Navigation & Software Integration Engineer",
      company: "Bodensee Racing Team (BRT Formula Student)",
      location: "Konstanz, Germany",
      startDate: "2024",
      endDate: "2025",
      bullets: [
        "Developed and integrated embedded software in C++ and Python on Linux-based edge computers and microcontrollers for sensor acquisition and real-time control.",
        "Designed and executed comprehensive automated test suites and bring-up protocols, diagnosing system bottlenecks and hardware-software integration bugs.",
        "Implemented sensor fusion algorithms and real-time telemetry pipelines, validating system performance across intensive track test scenarios.",
      ],
    },
    {
      position: "Founder & AI Systems Engineer",
      company: "Cedzlabs",
      location: "Remote",
      startDate: "2023",
      endDate: "Ongoing",
      bullets: [
        "Directed the technical architecture and end-to-end implementation of AI-powered SaaS solutions, LLM fine-tuning pipelines, and vector database integrations.",
        "Automated cloud provisioning, Docker containerization, and continuous delivery pipelines across AWS and GCP cloud environments.",
        "Conducted extensive model benchmark evaluations, failure mode analysis, and technical documentation to ensure maintainability.",
      ],
    },
  ],
  projects: [
    {
      name: "Production MLOps Pipeline & Model Serving Framework",
      technologies: ["Python", "MLflow", "Docker", "Kubernetes", "GitHub Actions", "FastAPI", "pytest"],
      bullets: [
        "Designed an end-to-end MLOps pipeline automating data ingestion, model training, artifact versioning (MLflow), and containerized deployment.",
        "Configured CI/CD workflows triggering automated model validation, schema compliance testing, and zero-downtime deployment to Kubernetes clusters.",
        "Implemented real-time inference latency tracking, data drift monitoring, and automated alerting via webhooks.",
      ],
    },
    {
      name: "Edge Computer Vision & Real-Time Inference Engine",
      technologies: ["PyTorch", "OpenCV", "Python", "Docker", "Linux Edge Deployment"],
      bullets: [
        "Engineered a lightweight 2D computer vision inference pipeline for real-time safety monitoring, optimized for constrained edge hardware.",
        "Automated model quantization and benchmark evaluation suites, achieving low-latency inference with high classification precision.",
      ],
    },
  ],
  education: [
    {
      degree: "M.Sc. in Computer and Information Science",
      institution: "University of Konstanz",
      location: "Konstanz, Germany",
      period: "04/2025 – Present",
      details: "Focus: AI for Robotics, Multi-Agent Systems, Distributed Computing, Machine Learning",
    },
    {
      degree: "B.Sc. in Computer Science & Engineering",
      institution: "JNTU Kakinada & Blekinge Institute of Technology (BTH)",
      location: "India & Sweden",
      period: "Graduated",
      details: "Focus: Software Engineering, Distributed Systems, Web Technologies & Spatial Computing",
    },
  ],
  certifications: [
    "AWS Cloud Architecture / Practitioner Fundamentals",
    "Deep Learning Specialization (DeepLearning.AI)",
    "Advanced C++ & Distributed Systems",
  ],
  languages: ["English (Fluent / C1-C2)", "German (Fluent / B2-C1)", "Telugu (Native)"],
};

const clData = {
  sender: {
    name: "Venkata Sai Yakkshit Reddy Asodi",
    title: "MLOps Engineer / Cloud & ML Solutions Specialist",
    email: "saiyakkshit2001@gmail.com",
    phone: "+49 1713562972",
    location: "Germany",
    linkedin: "https://linkedin.com/in/yakkshit",
  },
  recipient: {
    company: "Accenture",
    team: "Talent Acquisition / Cloud & MLOps Team",
    address: "Germany",
  },
  date: "March 09, 2026",
  subject: "Application for MLOps Analyst / Senior Analyst (Cloud & ML Solutions)",
  salutation: "Dear Hiring Team,",
  paragraphs: [
    "I am writing to express my enthusiastic interest in the MLOps Analyst / Senior Analyst position at Accenture. With a strong background in computer science, distributed architectures, and hands-on experience building automated CI/CD pipelines, containerized ML environments (Docker, Kubernetes), and cloud-native workflows, I am eager to help Accenture deliver robust, production-grade machine learning solutions to global Fortune 500 enterprises.",
    "During my tenure as Lead Full-Stack & MLOps Developer at Circleup AG and as an AI Pipeline Developer at Nutrish.ai, I specialized in bridging the gap between data science experimentation and robust software operations. I architected microservices, containerized machine learning models, and designed automated CI/CD pipelines (GitHub Actions, GitLab CI) that streamlined model testing, validation, and zero-downtime deployment. Furthermore, through my M.Sc. studies at the University of Konstanz and research in multi-agent distributed systems, I have cultivated deep expertise in telemetry logging, model performance optimization, and scalable Python/C++ development.",
    "Accenture's reputation for driving impactful technological transformation and building resilient cloud ecosystems resonates deeply with my career objectives. I bring a solid understanding of MLOps frameworks (MLflow, Airflow, Kubeflow), cloud infrastructure principles (AWS/GCP), and Linux environments, paired with a disciplined approach to automated testing, code quality, and process documentation. I thrive in cross-functional, agile settings where data scientists, engineers, and enterprise architects work collaboratively toward shared success.",
    "I look forward to the opportunity to contribute my technical rigor, proactive mindset, and passion for reliable machine learning operations to your team. Thank you for your time and consideration. I welcome the opportunity to discuss my qualifications during an interview.",
  ],
  signOff: "Sincerely,",
};

async function generate() {
  const targetDir = "/Users/yakkshit/Downloads/resume/03-09-2026";
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cvFileName = "Accenture_MLOps_CV.pdf";
  const clFileName = "Accenture_MLOps_C.pdf";
  const timestampCvFileName = "15_48_3_09_2026_CV.pdf";
  const timestampClFileName = "15_48_3_09_2026_C.pdf";

  const cvFilePath = path.join(targetDir, cvFileName);
  const clFilePath = path.join(targetDir, clFileName);

  console.log("Generating Resume PDF...");
  await renderToFile(h(ResumeDocument, { data: cvData }), cvFilePath);

  console.log("Generating Cover Letter PDF...");
  await renderToFile(h(CoverLetterDocument, { data: clData }), clFilePath);

  // Copy to timestamped filenames as well
  fs.copyFileSync(cvFilePath, path.join(targetDir, timestampCvFileName));
  fs.copyFileSync(clFilePath, path.join(targetDir, timestampClFileName));

  const cvBuffer = fs.readFileSync(cvFilePath);
  const clBuffer = fs.readFileSync(clFilePath);

  const cvPages = countPdfPages(cvBuffer);
  const clPages = countPdfPages(clBuffer);

  console.log(`\n================ GENERATION SUMMARY ================`);
  console.log(`Resume PDF: ${cvFilePath} (${cvPages} pages)`);
  console.log(`Cover Letter PDF: ${clFilePath} (${clPages} pages)`);
  console.log(`Timestamped Resume: ${path.join(targetDir, timestampCvFileName)}`);
  console.log(`Timestamped Cover Letter: ${path.join(targetDir, timestampClFileName)}`);
  console.log(`====================================================\n`);

  if (cvPages !== 2) {
    console.error(`WARNING: Resume page count is ${cvPages}, expected exactly 2 pages!`);
  }
  if (clPages !== 1) {
    console.error(`WARNING: Cover Letter page count is ${clPages}, expected exactly 1 page!`);
  }
}

generate().catch((err) => {
  console.error("Error generating application PDFs:", err);
  process.exit(1);
});
