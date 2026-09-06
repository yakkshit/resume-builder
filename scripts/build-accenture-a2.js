const fs = require("fs");
const path = require("path");
const React = require("react");
const { createElement: h } = React;
const { renderToFile } = require("@react-pdf/renderer");
const { ModernPDFTemplate } = require("../components/pdf-templates/cv/general-resumes/modern-pdf-template");
const { ModernCoverLetterPDFTemplate } = require("../components/pdf-templates/coverletter/modern-cover-letter-template");

function countPdfPages(pdfBuffer) {
  const content = pdfBuffer.toString("latin1");
  const matches = content.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

const rawProfile = fs.readFileSync(
  "/Users/yakkshit/Downloads/resume/storage/ai-career-assistant-1786020087673.json",
  "utf-8"
);
const storedProfile = JSON.parse(rawProfile);
const profilePic =
  storedProfile.resumeData?.basicInfo?.profilePicture ||
  storedProfile.profile?.profilePicture ||
  "";

const accentureResumeData = {
  basicInfo: {
    name: "Venkata Sai Yakkshit Reddy Asodi",
    title: "MLOps Engineer / Cloud & ML Solutions Specialist",
    email: "saiyakkshit2001@gmail.com",
    phone: "+49 1713562972",
    location: "Germany",
    linkedin: "yakkshit",
    website: "yakkshit.com",
    profilePicture: profilePic,
    portfolioLinks: [
      { platform: "GitHub", url: "https://github.com/yakkshit" },
      { platform: "Website", url: "https://yakkshit.com" },
    ],
    languages: ["English (Fluent / Professional)", "Deutsch (A2 / Grundkenntnisse)", "Telugu (Native)"],
    summary:
      "Software & MLOps Engineer with a Master's background in Computer & Information Science (AI/Distributed Systems) and hands-on experience designing scalable cloud infrastructures, containerized ML pipelines (Docker, Kubernetes), and automated CI/CD workflows. Proven track record in orchestrating end-to-end model lifecycles—from data preprocessing and PyTorch/TensorFlow model optimization to automated validation, deployment, and real-time monitoring. Adept at cross-functional collaboration with data scientists, engineers, and enterprise stakeholders.",
  },
  experience: [
    {
      company: "Circleup AG",
      position: "Lead Full-Stack & MLOps Developer",
      startDate: "12/2023",
      endDate: "12/2024",
      description:
        "Architected microservices and automated CI/CD pipelines (GitHub Actions, GitLab CI) for production machine learning model deployment. Containerized deep learning & NLP inference pipelines, optimizing model serving latency and resource utilization. Implemented automated validation testing, performance logging, and MLOps workflows.",
      highlights: ["Docker", "Kubernetes", "CI/CD", "MLOps", "Microservices", "Code Reviews"],
    },
    {
      company: "Nutrish.ai",
      position: "Software Developer Intern (AI Pipelines & Backend)",
      startDate: "01/2025",
      endDate: "07/2025",
      description:
        "Engineered scalable Python backend architectures and RESTful APIs for real-time AI nutrition agent inference and recommendation serving. Constructed automated data preprocessing and feature engineering pipelines, handling large multimodal datasets with high throughput and automated validation checks.",
      highlights: ["Python", "FastAPI", "Data Pipelines", "Model Validation", "pytest"],
    },
    {
      company: "University of Konstanz",
      position: "Research Assistant (AI & Distributed Multi-Agent Systems)",
      startDate: "02/2026",
      endDate: "Present",
      description:
        "Developed modular, distributed multi-agent frameworks using Python and C++ for decentralized robotic coordination and autonomous decision-making. Built automated telemetry, real-time logging, and diagnostic pipelines for analyzing high-dimensional system and sensor data.",
      highlights: ["Distributed Systems", "Multi-Agent AI", "Python", "C++", "Telemetry"],
    },
    {
      company: "Bodensee Racing Team (BRT Formula Student)",
      position: "Autonomous Navigation & Software Integration Engineer",
      startDate: "2024",
      endDate: "2025",
      description:
        "Developed and integrated embedded software in C++ and Python on Linux-based edge computers for sensor acquisition and real-time control. Designed and executed automated test suites and bring-up protocols, diagnosing system bottlenecks and hardware-software integration bugs.",
      highlights: ["C++", "Python", "ROS/ROS2", "Sensor Fusion", "Linux"],
    },
    {
      company: "Cedzlabs",
      position: "Founder & AI Systems Engineer",
      startDate: "2023",
      endDate: "Ongoing",
      description:
        "Directed the technical architecture and end-to-end implementation of AI-powered SaaS solutions, LLM fine-tuning pipelines, and vector database integrations. Automated cloud provisioning, Docker containerization, and continuous delivery pipelines across cloud environments.",
      highlights: ["LLM Pipelines", "Vector DBs", "Docker", "Cloud APIs"],
    },
  ],
  projects: [
    {
      name: "Production MLOps Pipeline & Model Serving Framework",
      description:
        "Designed an end-to-end MLOps pipeline automating data ingestion, model training, artifact versioning (MLflow), and containerized deployment with CI/CD workflows triggering automated model validation, schema compliance testing, and zero-downtime deployment.",
      technologies: ["Python", "MLflow", "Docker", "Kubernetes", "GitHub Actions", "FastAPI", "pytest"],
    },
    {
      name: "Edge Computer Vision & Real-Time Inference Engine",
      description:
        "Engineered a lightweight 2D computer vision inference pipeline for real-time safety monitoring, optimized for constrained edge hardware with automated model quantization and benchmark evaluation suites.",
      technologies: ["PyTorch", "OpenCV", "Python", "Docker", "Edge AI"],
    },
  ],
  education: [
    {
      institution: "University of Konstanz",
      degree: "M.Sc. in Computer and Information Science",
      field: "AI for Robotics, Multi-Agent Systems, Distributed Computing, Machine Learning",
      startDate: "04/2025",
      endDate: "Present",
      gpa: "",
    },
    {
      institution: "JNTU Kakinada & Blekinge Institute of Technology (BTH)",
      degree: "B.Sc. in Computer Science & Engineering",
      field: "Software Engineering, Distributed Systems, Web Technologies & Spatial Computing",
      startDate: "2019",
      endDate: "2023",
      gpa: "",
    },
  ],
  achievements: [
    {
      title: "AWS Cloud Architecture / Practitioner Fundamentals",
      description: "Cloud infrastructure, serverless computing, VPCs, and storage services.",
      date: "Certified",
    },
    {
      title: "Deep Learning Specialization (DeepLearning.AI)",
      description: "Neural Networks, CNNs, Sequence Models, Transformers.",
      date: "Certified",
    },
    {
      title: "Advanced C++ & Distributed Systems",
      description: "Memory management, multithreading, real-time low-latency systems.",
      date: "Certified",
    },
  ],
  skills: [
    "MLflow",
    "Kubeflow",
    "Apache Airflow",
    "Docker",
    "Kubernetes",
    "CI/CD (GitHub Actions, GitLab CI)",
    "Model Versioning & Monitoring",
    "Python (FastAPI, Flask, NumPy, Pandas)",
    "PyTorch",
    "TensorFlow",
    "scikit-learn",
    "AWS (EC2, S3, Lambda)",
    "Linux / Bash",
    "Automated Testing (pytest)",
    "Microservices Architecture",
    "C++",
    "SQL / PostgreSQL",
    "ROS / ROS2",
    "Git / GitLab / GitHub",
    "English (Fluent)",
    "Deutsch (A2)",
    "Telugu (Native)",
  ],
};

const accentureCoverLetterData = {
  head:
    "Venkata Sai Yakkshit Reddy Asodi\nMLOps Engineer / Cloud & ML Solutions Specialist\nEmail: saiyakkshit2001@gmail.com • Phone: +49 1713562972 • Germany\n\nAccenture\nTalent Acquisition / Cloud & MLOps Team\nGermany",
  body:
    "Application for MLOps Analyst / Senior Analyst (Cloud & ML Solutions)\n\nDear Hiring Team,\n\nI am writing to express my enthusiastic interest in the MLOps Analyst / Senior Analyst position at Accenture. With a strong background in computer science, distributed architectures, and hands-on experience building automated CI/CD pipelines, containerized ML environments (Docker, Kubernetes), and cloud-native workflows, I am eager to help Accenture deliver robust, production-grade machine learning solutions to global Fortune 500 enterprises.\n\nDuring my tenure as Lead Full-Stack & MLOps Developer at Circleup AG and as an AI Pipeline Developer at Nutrish.ai, I specialized in bridging the gap between data science experimentation and robust software operations. I architected microservices, containerized machine learning models, and designed automated CI/CD pipelines (GitHub Actions, GitLab CI) that streamlined model testing, validation, and zero-downtime deployment. Furthermore, through my M.Sc. studies at the University of Konstanz and research in multi-agent distributed systems, I have cultivated deep expertise in telemetry logging, model performance optimization, and scalable Python/C++ development.\n\nAccenture's reputation for driving impactful technological transformation and building resilient cloud ecosystems resonates deeply with my career objectives. I bring a solid understanding of MLOps frameworks (MLflow, Airflow, Kubeflow), cloud infrastructure principles (AWS/GCP), and Linux environments, paired with a disciplined approach to automated testing, code quality, and process documentation. I thrive in cross-functional, agile settings where data scientists, engineers, and enterprise architects work collaboratively toward shared success.",
  footer:
    "I look forward to the opportunity to contribute my technical rigor, proactive mindset, and passion for reliable machine learning operations to your team. Thank you for your time and consideration. I welcome the opportunity to discuss my qualifications during an interview.\n\nSincerely,\nVenkata Sai Yakkshit Reddy Asodi",
};

async function build() {
  const targetDir = "/Users/yakkshit/Downloads/resume/03-09-2026";
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cvFileName = "Accenture_MLOps_CV.pdf";
  const clFileName = "Accenture_MLOps_C.pdf";
  const timestampCvFileName = "11_32_4_09_2026_CV.pdf";
  const timestampClFileName = "11_32_4_09_2026_C.pdf";

  const cvFilePath = path.join(targetDir, cvFileName);
  const clFilePath = path.join(targetDir, clFileName);

  console.log("Rendering Accenture MLOps CV (Modern Template + Photo + German A2 in Languages & Skills)...");
  const cvDoc = h(ModernPDFTemplate, { resumeData: accentureResumeData });
  await renderToFile(cvDoc, cvFilePath);

  console.log("Rendering Accenture MLOps Cover Letter...");
  const clDoc = h(ModernCoverLetterPDFTemplate, { coverLetterData: accentureCoverLetterData });
  await renderToFile(clDoc, clFilePath);

  // Copy to timestamped filenames
  fs.copyFileSync(cvFilePath, path.join(targetDir, timestampCvFileName));
  fs.copyFileSync(clFilePath, path.join(targetDir, timestampClFileName));

  const cvBuf = fs.readFileSync(cvFilePath);
  const clBuf = fs.readFileSync(clFilePath);

  console.log("\n================ EXACT PAGE COUNT VERIFICATION ================");
  console.log(`Accenture Resume (${cvFilePath}): ${countPdfPages(cvBuf)} pages`);
  console.log(`Accenture Cover Letter (${clFilePath}): ${countPdfPages(clBuf)} pages`);
  console.log(`Timestamped Resume: ${path.join(targetDir, timestampCvFileName)}`);
  console.log(`Timestamped Cover Letter: ${path.join(targetDir, timestampClFileName)}`);
  console.log("================================================================\n");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
