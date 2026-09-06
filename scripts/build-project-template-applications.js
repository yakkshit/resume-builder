const fs = require("fs");
const path = require("path");
const React = require("react");
const { createElement: h } = React;
const { renderToFile } = require("@react-pdf/renderer");
const { ModernPDFTemplate } = require("../components/pdf-templates/cv/general-resumes/modern-pdf-template");
const { GermanAnschreibenTemplate } = require("../components/pdf-templates/coverletter/german-anschreiben-template");
const { ModernCoverLetterPDFTemplate } = require("../components/pdf-templates/coverletter/modern-cover-letter-template");

function countPdfPages(pdfBuffer) {
  const content = pdfBuffer.toString("latin1");
  const matches = content.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

// 1. Read master profile and extract profile picture
const rawProfile = fs.readFileSync(
  "/Users/yakkshit/Downloads/resume/storage/ai-career-assistant-1786020087673.json",
  "utf-8"
);
const storedProfile = JSON.parse(rawProfile);
const profilePic =
  storedProfile.resumeData?.basicInfo?.profilePicture ||
  storedProfile.profile?.profilePicture ||
  "";

// =========================================================================
// HWS APPLICATION DATA (EXACT 2-PAGE MODERN TEMPLATE + 1-PAGE COVER LETTER)
// =========================================================================
const hwsResumeData = {
  basicInfo: {
    name: "Venkata Sai Yakkshit Reddy Asodi",
    title: "AI Engineer & Agentic Systems Developer",
    email: "saiyakkshit2001@gmail.com",
    phone: "+49 1713562972",
    location: "Deutschland (Remote)",
    linkedin: "yakkshit",
    website: "yakkshit.com",
    profilePicture: profilePic,
    portfolioLinks: [
      { platform: "GitHub", url: "https://github.com/yakkshit" },
      { platform: "Website", url: "https://yakkshit.com" },
    ],
    languages: ["Deutsch (Fließend / C1)", "Englisch (Fließend / C1-C2)", "Telugu (Muttersprache)"],
    summary:
      "Informatik-Masterstudent an der Universität Konstanz mit fundierter Praxiserfahrung in der Konzeption, Entwicklung und Evaluierung von KI-Agenten, agentischen Workflows und LLM-basierten Automatisierungslösungen. Versiert in Python, RESTful APIs, Prompt Engineering, RAG-Systemen und strukturierter Datenaufbereitung. Nachweisbare Erfolge beim Aufbau robuster KI-Pipelines, systematischer Qualitätssicherung sowie bei der Übersetzung komplexer Fachanforderungen in intuitive, praxistaugliche Softwarewerkzeuge.",
  },
  experience: [
    {
      company: "Cedzlabs",
      position: "Founder & Lead AI Engineer",
      startDate: "2023",
      endDate: "Heute",
      description:
        "Konzeption und Implementierung maßgeschneiderter KI-Agenten und modularer Skills zur Automatisierung datenintensiver Geschäftsprozesse. Entwicklung strukturierter Prompt-Ketten, Entscheidungsbäume und Evaluierungsmetriken für konsistente, halluzinationsfreie Modellantworten. Aufbau von Datenaufbereitungs-Pipelines zur Extraktion und Strukturierung heterogener Dokumente (PDFs, Tabellen, strukturierte Berichte).",
      highlights: ["AI Agents", "Prompt Engineering", "LLM Fine-Tuning", "Python", "RAG", "Docker"],
    },
    {
      position: "Wissenschaftliche Hilfskraft (Multi-Agenten-Systeme & KI)",
      company: "Universität Konstanz",
      startDate: "02/2026",
      endDate: "Heute",
      description:
        "Forschung und Entwicklung modularer Multi-Agenten-Frameworks in Python und C++ für autonome Koordinations- und Entscheidungsprozesse. Implementierung von Schnittstellen zur Echtzeit-Telemetrie und automatisierten Validierung komplexer Verhaltenslogiken. Erstellung detaillierter technischer Dokumentationen und Schulungsmaterialien.",
      highlights: ["Multi-Agent Systems", "Python", "C++", "Qualitätssicherung", "Dokumentation"],
    },
    {
      position: "Software Developer Intern (KI-Pipelines & Backend)",
      company: "Nutrish.ai",
      startDate: "01/2025",
      endDate: "07/2025",
      description:
        "Entwicklung skalierbarer Python-Backend-Dienste und REST-APIs für interaktive KI-Assistenten und strukturierte Datenanalysen. Aufbau automatisierter Datenverarbeitungspipelines zur Vorbereitung großer Datenmengen für Inferenz- und Analysemodelle inklusive umfassender Unittests und Validierungsprüfungen.",
      highlights: ["Python", "FastAPI", "RESTful APIs", "Datenaufbereitung", "Automated Testing"],
    },
    {
      position: "Lead Full-Stack & MLOps Developer",
      company: "Circleup AG",
      startDate: "12/2023",
      endDate: "12/2024",
      description:
        "Leitung der Umstellung auf Microservices-Architektur; Etablierung automatisierter CI/CD-Pipelines mit GitHub Actions und Docker. Integration von Machine-Learning- und NLP-Modellen in Test- und Produktivumgebungen inklusive Performancemonitoring, Code Reviews und Testautomatisierungsstandards.",
      highlights: ["Microservices", "Docker", "CI/CD", "MLOps", "Code Reviews"],
    },
    {
      position: "Autonomous Software & Navigation Engineer",
      company: "Bodensee Racing Team (BRT Formula Student)",
      startDate: "2024",
      endDate: "2025",
      description:
        "Entwicklung zuverlässiger Softwarekomponenten in C++ und Python für hardwarenahe Steuerung und Sensor-Fusion auf Linux-Systemen. Systematische Fehleranalyse, Durchführung strukturierter Testläufe und Dokumentation der Systemzuverlässigkeit.",
      highlights: ["C++", "Python", "ROS/ROS2", "Testing", "Linux"],
    },
  ],
  projects: [
    {
      name: "Spezialisierte KI-Agenten & Workflow-Orchestrierung",
      description:
        "Entwurf einer modularen Agenten-Architektur zur automatisierten Erfassung, Analyse und Zusammenfassung von Geschäftsdaten und Fachtexten. Integration strukturierter Fragebögen und Validierungsfilter zur fehlerfreien Generierung formalisierter Arbeitsberichte mit automatisierter Evaluierungssuite.",
      technologies: ["Python", "FastAPI", "AI SDK", "LangChain", "Vector DB", "Docker", "pytest"],
    },
    {
      name: "Dokumenten-Parsing & Intelligente Datenextraktion",
      description:
        "Entwicklung robuster Parser und Extraktionsalgorithmen zur Überführung unstrukturierter Dokumente (PDFs, Tabellen) in normierte JSON- und Tabellenformate mit gezielten Nachvalidierungsregeln zur Reduktion von Fehlerraten.",
      technologies: ["Python", "PyTorch", "OpenCV", "Pandas", "REST APIs"],
    },
  ],
  education: [
    {
      institution: "Universität Konstanz",
      degree: "M.Sc. in Computer and Information Science",
      field: "Künstliche Intelligenz, Multi-Agenten-Systeme, Verteilte Systeme",
      startDate: "04/2025",
      endDate: "Heute",
      gpa: "",
    },
    {
      institution: "JNTU Kakinada & Blekinge Institute of Technology (BTH)",
      degree: "B.Sc. in Computer Science & Engineering",
      field: "Software Engineering, Verteilte Systeme, Web-Technologien",
      startDate: "2019",
      endDate: "2023",
      gpa: "",
    },
  ],
  achievements: [
    {
      title: "Deep Learning Specialization (DeepLearning.AI)",
      description: "Neural Networks, CNNs, Sequence Models, Transformers & LLM Architectures.",
      date: "Zertifiziert",
    },
    {
      title: "AWS Cloud Architecture & Practitioner Fundamentals",
      description: "Cloud Infrastructure, Scalable Microservices, Container Orchestration.",
      date: "Zertifiziert",
    },
    {
      title: "Advanced C++ & Distributed Systems",
      description: "Echtzeitverarbeitung, Multithreading, System-Monitoring.",
      date: "Zertifiziert",
    },
  ],
  skills: [
    "KI-Agenten & Agentic Workflows",
    "Prompt Engineering",
    "LLM Fine-Tuning",
    "Python",
    "FastAPI",
    "RAG & Vektordatenbanken",
    "AI SDK",
    "LangChain",
    "RESTful APIs",
    "Datenaufbereitung (PDF/Tabellen/DATEV)",
    "Docker",
    "CI/CD Pipelines",
    "Qualitätssicherung & Testing",
    "Claude & Codex Tools",
    "C++",
    "Git/GitLab",
    "Deutsch (Fließend)",
    "Englisch (Fließend)",
  ],
};

const hwsCoverLetterData = {
  head:
    "Venkata Sai Yakkshit Reddy Asodi\nInformatik-Masterstudent & KI-Entwickler\nE-Mail: saiyakkshit2001@gmail.com • Tel: +49 1713562972 • Deutschland\n\nHWS Wirtschaftsprüfung & Steuerberatung\nPersonalabteilung / Team KI-Plattform\nDeutschland (Remote)",
  body:
    "Bewerbung als Entwickler für KI-Agenten & KI-Plattform (m/w/d)\n\nSehr geehrte Damen und Herren,\n\nmit großer Begeisterung habe ich Ihre Ausschreibung zur Entwicklung der internen KI-Plattform bei HWS gelesen. Die Vision, Wirtschaftsprüfung und Steuerberatung durch spezialisierte KI-Agenten und maßgeschneiderte Skills im Kanzleialltag wirksam zu unterstützen, spricht mich fachlich wie persönlich stark an. Als Masterstudent der Informatik an der Universität Konstanz mit praktischem Schwerpunkt auf agentischen Workflows, Prompt Engineering und Python-Entwicklung möchte ich mein Know-how gewinnbringend in Ihr Team einbringen.\n\nIn meiner Rolle als Gründer und AI Engineer bei Cedzlabs sowie bei Nutrish.ai habe ich umfassende Praxiserfahrung im Aufbau und in der Optimierung von KI-Agenten gesammelt. Dabei übersetze ich komplexe Anforderungen in robuste Entscheidungslogiken, formuliere präzise Prompts und entwickle strukturierte Workflows zur Aufbereitung heterogener Datenbestände (z. B. Tabellen, Dokumente und Exporte). Auch an der Universität Konstanz erforsche ich als wissenschaftliche Hilfskraft dezentrale Multi-Agenten-Systeme, bei denen systematische Tests, Fehleranalysen und belastbare Qualitätsstandards im Mittelpunkt stehen.\n\nIch bin es gewohnt, moderne KI- und Coding-Tools wie Claude und Codex pragmatisch einzusetzen, um aus Ideen schnell funktionierende, sichere Lösungen zu schaffen. Dabei lege ich großen Wert darauf, Ergebnisse stets kritisch zu hinterfragen, Qualitätsstandards kontinuierlich weiterzuentwickeln und Lösungen so verständlich zu dokumentieren, dass Kolleginnen und Kollegen aus den Fachbereichen Steuerberatung und Wirtschaftsprüfung diese im Arbeitsalltag intuitiv anwenden können.",
  footer:
    "Ich freue mich darauf, die digitale Transformation von HWS aktiv mitzugestalten und stehe Ihnen für eine Remote-Tätigkeit flexibel zur Verfügung. Über die Einladung zu einem persönlichen Gespräch freue ich mich sehr.\n\nMit freundlichen Grüßen,\nVenkata Sai Yakkshit Reddy Asodi",
};

// =========================================================================
// ACCENTURE APPLICATION DATA (EXACT 2-PAGE MODERN TEMPLATE + 1-PAGE COVER LETTER)
// =========================================================================
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
    languages: ["English (Fluent / C1-C2)", "German (Fluent / B2-C1)", "Telugu (Native)"],
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
    "Microservices",
    "C++",
    "SQL",
    "English (Fluent)",
    "German (Fluent)",
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

async function buildAll() {
  const targetDir = "/Users/yakkshit/Downloads/resume/03-09-2026";
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log("Rendering HWS Application PDFs with project Modern template + Photo...");
  const hwsCvDoc = h(ModernPDFTemplate, { resumeData: hwsResumeData });
  const hwsClDoc = h(ModernCoverLetterPDFTemplate, { coverLetterData: hwsCoverLetterData });

  const hwsCvPath = path.join(targetDir, "HWS_AI_Agent_CV.pdf");
  const hwsClPath = path.join(targetDir, "HWS_AI_Agent_C.pdf");
  await renderToFile(hwsCvDoc, hwsCvPath);
  await renderToFile(hwsClDoc, hwsClPath);

  console.log("Rendering Accenture Application PDFs with project Modern template + Photo...");
  const accCvDoc = h(ModernPDFTemplate, { resumeData: accentureResumeData });
  const accClDoc = h(ModernCoverLetterPDFTemplate, { coverLetterData: accentureCoverLetterData });

  const accCvPath = path.join(targetDir, "Accenture_MLOps_CV.pdf");
  const accClPath = path.join(targetDir, "Accenture_MLOps_C.pdf");
  await renderToFile(accCvDoc, accCvPath);
  await renderToFile(accClDoc, accClPath);

  // Check page counts
  const hwsCvBuf = fs.readFileSync(hwsCvPath);
  const hwsClBuf = fs.readFileSync(hwsClPath);
  const accCvBuf = fs.readFileSync(accCvPath);
  const accClBuf = fs.readFileSync(accClPath);

  console.log("\n================ EXACT PAGE COUNT VERIFICATION ================");
  console.log(`HWS Resume (${hwsCvPath}): ${countPdfPages(hwsCvBuf)} pages`);
  console.log(`HWS Cover Letter (${hwsClPath}): ${countPdfPages(hwsClBuf)} pages`);
  console.log(`Accenture Resume (${accCvPath}): ${countPdfPages(accCvBuf)} pages`);
  console.log(`Accenture Cover Letter (${accClPath}): ${countPdfPages(accClBuf)} pages`);
  console.log("================================================================\n");
}

buildAll().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
