import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "@/components/logos/logos"

// Optimized German Lebenslauf template - 2 pages max with circular photo
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: "15 25",
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: "#2d3748",
    lineHeight: 1.3,
  },

  // Header Section - Optimized
  header: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  photoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 20,
    flexShrink: 0,
    border: "2px solid #e2e8f0",
    overflow: "hidden",
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 12,
    color: "#4a5568",
    marginBottom: 12,
    fontFamily: "Times-Italic",
  },

  // Personal Information Section - Compact
  personalSection: {
    marginBottom: 15,
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottom: "1px solid #2d3748",
    paddingBottom: 3,
  },
  personalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  personalColumn: {
    flex: 1,
    minWidth: 180,
  },
  personalItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  personalLabel: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: "#4a5568",
    width: 80,
    marginRight: 10,
  },
  personalValue: {
    fontSize: 10,
    color: "#2d3748",
    flex: 1,
  },
  contactLink: {
    color: "#2563eb",
    textDecoration: "none",
  },

  // Main Content Sections - Compact
  mainSection: {
    marginBottom: 15,
  },

  // Experience/Education Items - Optimized
  experienceContainer: {
    marginTop: 8,
  },
  experienceItem: {
    flexDirection: "row",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: "1px solid #e2e8f0",
  },
  dateColumn: {
    width: 90,
    marginRight: 15,
    flexShrink: 0,
  },
  dateText: {
    fontSize: 9,
    color: "#4a5568",
    fontFamily: "Times-Bold",
  },
  contentColumn: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    marginBottom: 2,
  },
  experienceCompany: {
    fontSize: 10,
    color: "#2563eb",
    marginBottom: 2,
  },
  experienceLocation: {
    fontSize: 9,
    color: "#718096",
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 9,
    color: "#4a5568",
    lineHeight: 1.3,
  },

  // Education Items - Compact
  educationItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: "1px solid #e2e8f0",
  },
  educationTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    marginBottom: 2,
  },
  educationInstitution: {
    fontSize: 10,
    color: "#2563eb",
    marginBottom: 2,
  },
  educationDetails: {
    fontSize: 9,
    color: "#4a5568",
  },

  // Skills - More Compact
  skillsContainer: {
    marginTop: 8,
  },
  skillCategory: {
    marginBottom: 10,
  },
  skillCategoryTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    marginBottom: 4,
  },
  skillsList: {
    fontSize: 10,
    color: "#4a5568",
    lineHeight: 1.3,
  },

  // Projects Section - Compact
  projectItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: "1px solid #e2e8f0",
  },
  projectTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    marginBottom: 2,
  },
  projectDescription: {
    fontSize: 9,
    color: "#4a5568",
    lineHeight: 1.3,
    marginBottom: 3,
  },
  projectTechnologies: {
    fontSize: 9,
    color: "#718096",
    fontFamily: "Times-Italic",
  },

  // Languages - Compact
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    paddingBottom: 3,
    borderBottom: "1px dotted #e2e8f0",
  },
  languageName: {
    fontSize: 10,
    color: "#1a202c",
    fontFamily: "Times-Bold",
  },
  languageLevel: {
    fontSize: 10,
    color: "#4a5568",
  },

  // Additional Qualifications - Compact
  additionalItem: {
    marginBottom: 6,
  },
  additionalTitle: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    color: "#1a202c",
    marginBottom: 2,
  },
  additionalDescription: {
    fontSize: 9,
    color: "#4a5568",
    lineHeight: 1.3,
  },

  // German CV Footer - Compact with Fancy Signature
  footer: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  signatureSection: {
    alignItems: "flex-end",
  },
  dateLocation: {
    fontSize: 10,
    color: "#4a5568",
    marginBottom: 25,
  },
  signatureLine: {
    width: 180,
    borderBottom: "1px solid #2d3748",
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#718096",
    textAlign: "center",
  },
  fancySignature: {
    fontSize: 16,
    fontFamily: "Times-Italic",
    color: "#1a202c",
    textAlign: "center",
    marginBottom: 5,
    letterSpacing: 1,
    transform: "rotate(-5deg)",
  },

  // Two Column Layout for Better Space Usage
  twoColumnSection: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 15,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },

  // Compact Summary
  summaryText: {
    fontSize: 9,
    lineHeight: 1.3,
    color: "#4a5568",
    textAlign: "justify",
    backgroundColor: "#f7fafc",
    padding: 8,
    borderRadius: 3,
    borderLeft: "2px solid #2563eb",
  },
})

interface GermanLebenslaufTemplateProps {
  resumeData: ResumeData
}

export const GermanLebenslaufTemplate = ({ resumeData }: GermanLebenslaufTemplateProps) => {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  // Helper function to format skills by category
  const formatSkills = (skills: string[]) => {
    const technical = skills.filter(skill => 
      skill.toLowerCase().includes('javascript') || 
      skill.toLowerCase().includes('react') || 
      skill.toLowerCase().includes('node') ||
      skill.toLowerCase().includes('python') ||
      skill.toLowerCase().includes('java') ||
      skill.toLowerCase().includes('css') ||
      skill.toLowerCase().includes('html') ||
      skill.toLowerCase().includes('sql') ||
      skill.toLowerCase().includes('git')
    )

    const other = skills.filter(skill => !technical.includes(skill))

    return { technical, other }
  }

  const { technical, other } = formatSkills(skills || [])

  // Extract first two words of name for fancy signature
  const getSignatureName = (fullName: string) => {
    const words = fullName.split(' ')
    return words.slice(0, 2).join(' ')
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Circular Photo and Name */}
        <View style={styles.header}>
          {/* Circular Professional Photo */}
          {basicInfo.profilePicture ? (
            <View style={styles.photoContainer}>
              <Image 
                src={basicInfo.profilePicture} 
                style={styles.profilePhoto} 
                cache={false} 
              />
            </View>
          ) : null}

          {/* Header Content */}
          <View style={styles.headerContent}>
            <Text style={styles.name}>{basicInfo.name}</Text>
            <Text style={styles.title}>{basicInfo.title}</Text>
          </View>
        </View>

        {/* Persönliche Angaben (Personal Information) */}
        <View style={styles.personalSection}>
          <Text style={styles.sectionTitle}>Persönliche Angaben</Text>
          <View style={styles.personalGrid}>
            <View style={styles.personalColumn}>
              <View style={styles.personalItem}>
                <Text style={styles.personalLabel}>Name:</Text>
                <Text style={styles.personalValue}>{basicInfo.name}</Text>
              </View>
              {basicInfo.email ? (
                <View style={styles.personalItem}>
                  <Text style={styles.personalLabel}>E-Mail:</Text>
                  <Link src={`mailto:${basicInfo.email}`} style={styles.contactLink}>
                    <Text style={styles.personalValue}>{basicInfo.email}</Text>
                  </Link>
                </View>
              ) : null}
              {basicInfo.phone ? (
                <View style={styles.personalItem}>
                  <Text style={styles.personalLabel}>Telefon:</Text>
                  <Link src={`tel:${basicInfo.phone.replace(/[^\d+]/g, "")}`} style={styles.contactLink}>
                    <Text style={styles.personalValue}>{basicInfo.phone}</Text>
                  </Link>
                </View>
              ) : null}
            </View>
            <View style={styles.personalColumn}>
              {basicInfo.location ? (
                <View style={styles.personalItem}>
                  <Text style={styles.personalLabel}>Adresse:</Text>
                  <Text style={styles.personalValue}>{basicInfo.location}</Text>
                </View>
              ) : null}
              {basicInfo.linkedin ? (
                <View style={styles.personalItem}>
                  <Text style={styles.personalLabel}>LinkedIn:</Text>
                  <Link src={`https://linkedin.com/in/${basicInfo.linkedin}`} style={styles.contactLink}>
                    <Text style={styles.personalValue}>{basicInfo.linkedin}</Text>
                  </Link>
                </View>
              ) : null}
              {basicInfo.website ? (
                <View style={styles.personalItem}>
                  <Text style={styles.personalLabel}>Website:</Text>
                  <Link
                    src={basicInfo.website.startsWith("http") ? basicInfo.website : `https://${basicInfo.website}`}
                    style={styles.contactLink}
                  >
                    <Text style={styles.personalValue}>{basicInfo.website}</Text>
                  </Link>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Kurzprofil (Professional Summary) - Compact */}
        {basicInfo.summary ? (
          <View style={styles.mainSection}>
            <Text style={styles.sectionTitle}>Kurzprofil</Text>
            <Text style={styles.summaryText}>{basicInfo.summary}</Text>
          </View>
        ) : null}

        {/* Berufserfahrung (Professional Experience) */}
        {experience && experience.length > 0 ? (
          <View style={styles.mainSection}>
            <Text style={styles.sectionTitle}>Berufserfahrung</Text>
            <View style={styles.experienceContainer}>
              {experience.map((exp, index) => (
                <View key={`exp-${index}`} style={styles.experienceItem}>
                  <View style={styles.dateColumn}>
                    <Text style={styles.dateText}>
                      {exp.startDate} - {exp.endDate}
                    </Text>
                  </View>
                  <View style={styles.contentColumn}>
                    <Text style={styles.experienceTitle}>{exp.position}</Text>
                    <Text style={styles.experienceCompany}>{exp.company}</Text>
                    <Text style={styles.experienceDescription}>{exp.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Two Column Layout for Better Space Usage */}
        <View style={styles.twoColumnSection}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Ausbildung (Education) */}
            {education && education.length > 0 ? (
              <View style={styles.mainSection}>
                <Text style={styles.sectionTitle}>Ausbildung</Text>
                <View style={styles.experienceContainer}>
                  {education.map((edu, index) => (
                    <View key={`edu-${index}`} style={styles.educationItem}>
                      <View style={styles.dateColumn}>
                        <Text style={styles.dateText}>
                          {edu.startDate} - {edu.endDate}
                        </Text>
                      </View>
                      <View style={styles.contentColumn}>
                        <Text style={styles.educationTitle}>
                          {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                        </Text>
                        <Text style={styles.educationInstitution}>{edu.institution}</Text>
                        {edu.gpa ? <Text style={styles.educationDetails}>Note: {edu.gpa}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Sprachen (Languages) */}
            {basicInfo.languages && basicInfo.languages.length > 0 ? (
              <View style={styles.mainSection}>
                <Text style={styles.sectionTitle}>Sprachen</Text>
                {basicInfo.languages.map((language, index) => (
                  <View key={`lang-${index}`} style={styles.languageItem}>
                    <Text style={styles.languageName}>{language}</Text>
                    <Text style={styles.languageLevel}>Verhandlungssicher</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Kenntnisse und Fähigkeiten (Skills and Knowledge) */}
            {skills && skills.length > 0 ? (
              <View style={styles.mainSection}>
                <Text style={styles.sectionTitle}>Kenntnisse</Text>
                <View style={styles.skillsContainer}>
                  {technical.length > 0 ? (
                    <View style={styles.skillCategory}>
                      <Text style={styles.skillCategoryTitle}>Programmierung:</Text>
                      <Text style={styles.skillsList}>{technical.join(", ")}</Text>
                    </View>
                  ) : null}
                  {other.length > 0 ? (
                    <View style={styles.skillCategory}>
                      <Text style={styles.skillCategoryTitle}>Weitere:</Text>
                      <Text style={styles.skillsList}>{other.join(", ")}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Sonstige Qualifikationen (Additional Qualifications) */}
            {achievements && achievements.length > 0 ? (
              <View style={styles.mainSection}>
                <Text style={styles.sectionTitle}>Qualifikationen</Text>
                {achievements.map((achievement, index) => (
                  <View key={`ach-${index}`} style={styles.additionalItem}>
                    <Text style={styles.additionalTitle}>{achievement.title}</Text>
                    <Text style={styles.additionalDescription}>{achievement.description}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Projekte (Projects) - Full Width */}
        {projects && projects.length > 0 ? (
          <View style={styles.mainSection}>
            <Text style={styles.sectionTitle}>Projekte</Text>
            <View style={styles.experienceContainer}>
              {projects.map((project, index) => (
                <View key={`proj-${index}`} style={styles.projectItem}>
                  <View style={styles.dateColumn}>
                    <Text style={styles.dateText}>
                      {project.startDate && project.endDate 
                        ? `${project.startDate} - ${project.endDate}`
                        : (project.startDate || project.endDate || "-")}
                    </Text>
                  </View>
                  <View style={styles.contentColumn}>
                    <Text style={styles.projectTitle}>{project.name}</Text>
                    <Text style={styles.projectDescription}>{project.description}</Text>
                    <Text style={styles.projectTechnologies}>
                      Technologien: {(project.technologies || []).map(t => typeof t === "string" ? t : String(t)).join(", ")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* German CV Footer with Fancy Signature */}
        <View style={styles.footer}>
          <View style={styles.signatureSection}>
            <Text style={styles.dateLocation}>
              {basicInfo.location || "Ort"}, {new Date().toLocaleDateString("de-DE")}
            </Text>
            <Text style={styles.fancySignature}>{getSignatureName(basicInfo.name)}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Unterschrift</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}