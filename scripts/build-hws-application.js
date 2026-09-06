const React = require("react");
const { createElement: h } = React;
const { renderToFile } = require("@react-pdf/renderer");
const fs = require("fs");
const path = require("path");
const { ResumeDocument, CoverLetterDocument, countPdfPages } = require("./generate-application-pdfs");

const cvData = {
  personalInfo: {
    name: "Venkata Sai Yakkshit Reddy Asodi",
    title: "AI Engineer & Agentic Systems Developer (Python • LLMs • Multi-Agent Workflows)",
    email: "saiyakkshit2001@gmail.com",
    phone: "+49 1713562972",
    location: "Deutschland",
    linkedin: "https://linkedin.com/in/yakkshit",
    github: "https://github.com/yakkshit",
    website: "https://yakkshit.com",
  },
  summary:
    "Informatik-Masterstudent an der Universität Konstanz mit fundierter Praxiserfahrung in der Konzeption, Entwicklung und Evaluierung von KI-Agenten, agentischen Workflows und LLM-basierten Automatisierungslösungen. Versiert in Python, RESTful APIs, Prompt Engineering, RAG-Systemen und strukturierter Datenaufbereitung. Nachweisbare Erfolge beim Aufbau robuster KI-Pipelines und Microservices, systematischer Qualitätssicherung sowie bei der Übersetzung komplexer Fachanforderungen in intuitive, praxistaugliche Softwarewerkzeuge. Verhandlungssichere Deutsch- und Englischkenntnisse.",
  skills: [
    {
      category: "KI-Agenten & LLM-Frameworks",
      items: [
        "Agentic Workflows (Multi-Agent Systems)",
        "Prompt Engineering",
        "LLM Fine-Tuning",
        "AI SDK / LangChain",
        "RAG & Vektordatenbanken",
        "Qualitätssicherung & Validierung",
      ],
    },
    {
      category: "Programmierung & Backend",
      items: [
        "Python (FastAPI, Flask, NumPy, Pandas)",
        "C++",
        "RESTful APIs",
        "Microservices-Architektur",
        "Datenaufbereitung & ETL",
        "JSON/XML-Parsing",
      ],
    },
    {
      category: "Cloud, DevOps & Tools",
      items: [
        "Docker",
        "CI/CD (GitHub Actions, GitLab CI)",
        "Git/GitLab",
        "Linux",
        "Claude, Codex & AI Coding Tools",
        "Dokumentenverarbeitung (PDF/Tabellen)",
      ],
    },
    {
      category: "Methoden & Soft Skills",
      items: [
        "Systematisches Testing & Fehleranalyse",
        "Agile Softwareentwicklung (Scrum)",
        "Strukturierte Dokumentation",
        "Interdisziplinäre Zusammenarbeit",
      ],
    },
  ],
  experiencePage1: [
    {
      position: "Founder & Lead AI Engineer",
      company: "Cedzlabs",
      location: "Remote",
      startDate: "2023",
      endDate: "Heute",
      bullets: [
        "Konzeption und Implementierung maßgeschneiderter KI-Agenten und modularer Skills zur Automatisierung datenintensiver Geschäftsprozesse.",
        "Entwicklung strukturierter Prompt-Ketten, Entscheidungsbäume und Evaluierungsmetriken für konsistente, halluzinationsfreie Modellantworten.",
        "Aufbau von Datenaufbereitungs-Pipelines zur Extraktion und Strukturierung heterogener Dokumente (PDFs, Tabellen, strukturierte Berichte).",
        "Durchführung systematischer Regressionstests und kontinuierlicher Fehleranalysen zur nachhaltigen Optimierung der Modellqualität.",
      ],
    },
    {
      position: "Wissenschaftliche Hilfskraft (Multi-Agenten-Systeme & KI)",
      company: "Universität Konstanz",
      location: "Konstanz, Deutschland",
      startDate: "02/2026",
      endDate: "Heute",
      bullets: [
        "Forschung und Entwicklung modularer Multi-Agenten-Frameworks in Python und C++ für autonome Koordinations- und Entscheidungsprozesse.",
        "Implementierung von Schnittstellen zur Echtzeit-Telemetrie und automatisierten Validierung komplexer Verhaltenslogiken.",
        "Erstellung detaillierter technischer Dokumentationen und Schulungsmaterialien zur sicheren Nutzung und Weiterentwicklung der Systeme.",
      ],
    },
    {
      position: "Software Developer Intern (KI-Pipelines & Backend)",
      company: "Nutrish.ai",
      location: "Deutschland",
      startDate: "01/2025",
      endDate: "07/2025",
      bullets: [
        "Entwicklung skalierbarer Python-Backend-Dienste und REST-APIs für interaktive KI-Assistenten und strukturierte Datenanalysen.",
        "Aufbau automatisierter Datenverarbeitungspipelines zur Vorbereitung großer Datenmengen für Inferenz- und Analysemodelle.",
        "Implementierung umfassender Unittests und Validierungsprüfungen zur Gewährleistung hoher Datenkonsistenz und Ausfallsicherheit.",
      ],
    },
  ],
  experiencePage2: [
    {
      position: "Lead Full-Stack & MLOps Developer",
      company: "Circleup AG",
      location: "Deutschland",
      startDate: "12/2023",
      endDate: "12/2024",
      bullets: [
        "Leitung der Umstellung auf Microservices-Architektur und Etablierung automatisierter CI/CD-Pipelines mit GitHub Actions und Docker.",
        "Integration von Machine-Learning- und NLP-Modellen in Test- und Produktivumgebungen inklusive Performancemonitoring.",
        "Einführung von Code Reviews und Testautomatisierungsstandards zur Sicherung hoher Code- und Prozessqualität.",
      ],
    },
    {
      position: "Autonomous Software & Navigation Engineer",
      company: "Bodensee Racing Team (BRT Formula Student)",
      location: "Konstanz, Deutschland",
      startDate: "2024",
      endDate: "2025",
      bullets: [
        "Entwicklung zuverlässiger Softwarekomponenten in C++ und Python für hardwarenahe Steuerung und Sensor-Fusion auf Linux-Systemen.",
        "Systematische Fehleranalyse, Durchführung strukturierter Testläufe und Dokumentation der Systemzuverlässigkeit im interdisziplinären Team.",
      ],
    },
  ],
  projects: [
    {
      name: "Spezialisierte KI-Agenten & Workflow-Orchestrierung",
      technologies: ["Python", "FastAPI", "AI SDK", "LangChain", "Vector DB", "Docker", "pytest"],
      bullets: [
        "Entwurf einer Agenten-Architektur zur automatisierten Erfassung, Analyse und Zusammenfassung von Geschäftsdaten und Fachtexten.",
        "Integration strukturierter Fragebögen und Validierungsfilter zur fehlerfreien Generierung formalisierter Arbeitsberichte.",
        "Automatisierte Evaluierungssuite zur kontinuierlichen Qualitätsprüfung von Prompt-Varianten und Modellantworten.",
      ],
    },
    {
      name: "Dokumenten-Parsing & Intelligente Datenextraktion",
      technologies: ["Python", "PyTorch", "OpenCV", "Pandas", "REST APIs"],
      bullets: [
        "Entwicklung robuster Parser und Extraktionsalgorithmen zur Überführung unstrukturierter Dokumente in normierte JSON- und Tabellenformate.",
        "Optimierung der Verarbeitungsgeschwindigkeit und Reduktion von Fehlerraten durch gezielte Nachvalidierungsregeln.",
      ],
    },
  ],
  education: [
    {
      degree: "M.Sc. Computer and Information Science (Informatik)",
      institution: "Universität Konstanz",
      location: "Konstanz, Deutschland",
      period: "04/2025 – Heute",
      details: "Schwerpunkte: Künstliche Intelligenz, Multi-Agenten-Systeme, Machine Learning, Verteilte Systeme",
    },
    {
      degree: "B.Sc. Computer Science & Engineering",
      institution: "JNTU Kakinada & Blekinge Institute of Technology (BTH)",
      location: "Indien & Schweden",
      period: "Abschluss",
      details: "Schwerpunkte: Software Engineering, Verteilte Systeme, Web-Technologien, Datenbanken",
    },
  ],
  certifications: [
    "Deep Learning Specialization (DeepLearning.AI)",
    "AWS Cloud Architecture Fundamentals",
    "Advanced C++ & Distributed Systems",
  ],
  languages: ["Deutsch (Fließend in Wort und Schrift)", "Englisch (Fließend / C1-C2)", "Telugu (Muttersprache)"],
};

const clData = {
  sender: {
    name: "Venkata Sai Yakkshit Reddy Asodi",
    title: "Informatik-Masterstudent & KI-Entwickler",
    email: "saiyakkshit2001@gmail.com",
    phone: "+49 1713562972",
    location: "Deutschland (Remote)",
    linkedin: "https://linkedin.com/in/yakkshit",
  },
  recipient: {
    company: "HWS Wirtschaftsprüfung & Steuerberatung",
    team: "Personalabteilung / Team KI-Plattform",
    address: "Deutschland (Vollständig Remote)",
  },
  date: "04. September 2026",
  subject: "Bewerbung als Entwickler für KI-Agenten & KI-Plattform (m/w/d)",
  salutation: "Sehr geehrte Damen und Herren,",
  paragraphs: [
    "mit großer Begeisterung habe ich Ihre Ausschreibung zur Entwicklung der internen KI-Plattform bei HWS gelesen. Die Vision, Wirtschaftsprüfung und Steuerberatung durch spezialisierte KI-Agenten und maßgeschneiderte Skills im Kanzleialltag wirksam zu unterstützen, spricht mich fachlich wie persönlich stark an. Als Masterstudent der Informatik an der Universität Konstanz mit praktischem Schwerpunkt auf agentischen Workflows, Prompt Engineering und Python-Entwicklung möchte ich mein Know-how gewinnbringend in Ihr Team einbringen.",
    "In meiner Rolle als Gründer und AI Engineer bei Cedzlabs sowie bei Nutrish.ai habe ich umfassende Praxiserfahrung im Aufbau und in der Optimierung von KI-Agenten gesammelt. Dabei übersetze ich komplexe Anforderungen in robuste Entscheidungslogiken, formuliere präzise Prompts und entwickle strukturierte Workflows zur Aufbereitung heterogener Datenbestände (z. B. Tabellen, Dokumente und Exporte). Auch an der Universität Konstanz erforsche ich als wissenschaftliche Hilfskraft dezentrale Multi-Agenten-Systeme, bei denen systematische Tests, Fehleranalysen und belastbare Qualitätsstandards im Mittelpunkt stehen.",
    "Ich bin es gewohnt, moderne KI- und Coding-Tools wie Claude und Codex pragmatisch einzusetzen, um aus Ideen schnell funktionierende, sichere Lösungen zu schaffen. Dabei lege ich großen Wert darauf, Ergebnisse stets kritisch zu hinterfragen, Qualitätsstandards kontinuierlich weiterzuentwickeln und Lösungen so verständlich zu dokumentieren, dass Kolleginnen und Kollegen aus den Fachbereichen Steuerberatung und Wirtschaftsprüfung diese im Arbeitsalltag intuitiv anwenden können.",
    "Ich freue mich darauf, die digitale Transformation von HWS aktiv mitzugestalten und stehe Ihnen für eine Remote-Tätigkeit flexibel zur Verfügung. Über die Einladung zu einem persönlichen Gespräch freue ich mich sehr.",
  ],
  signOff: "Mit freundlichen Grüßen,",
};

async function generate() {
  const targetDir = "/Users/yakkshit/Downloads/resume/03-09-2026";
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const cvFileName = "HWS_AI_Agent_CV.pdf";
  const clFileName = "HWS_AI_Agent_C.pdf";
  const timestampCvFileName = "11_13_4_09_2026_CV.pdf";
  const timestampClFileName = "11_13_4_09_2026_C.pdf";

  const cvFilePath = path.join(targetDir, cvFileName);
  const clFilePath = path.join(targetDir, clFileName);

  console.log("Generating Resume PDF for HWS...");
  await renderToFile(h(ResumeDocument, { data: cvData }), cvFilePath);

  console.log("Generating Cover Letter PDF for HWS...");
  await renderToFile(h(CoverLetterDocument, { data: clData }), clFilePath);

  // Copy to timestamped filenames
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
  console.error("Error generating HWS application PDFs:", err);
  process.exit(1);
});
