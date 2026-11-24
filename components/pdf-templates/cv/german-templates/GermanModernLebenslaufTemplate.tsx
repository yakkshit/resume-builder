import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "@/components/logos/logos"
import { getResumeSectionTitles } from "@/lib/resume-section-titles"

// Modern German Lebenslauf layout with dark accent header and structured table-like sections
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 28,
    paddingVertical: 20,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#27272a",
    backgroundColor: "#ffffff",
    lineHeight: 1.3,
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#18181b",
    paddingBottom: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: "#3f3f46",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    objectFit: "cover",
  },
  headerMain: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
    marginBottom: 2,
    lineHeight: 1.15,
  },
  title: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    lineHeight: 1.2,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: 8,
    color: "#52525b",
    marginRight: 10,
    marginBottom: 2,
  },
  icon: {
    width: 8,
    height: 8,
    marginRight: 3,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
  },
  personalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  personalItem: {
    flexDirection: "row",
    width: "48%",
    marginBottom: 2,
    marginRight: "2%",
  },
  personalLabel: {
    width: 75,
    fontFamily: "Helvetica-Bold",
    color: "#71717a",
    fontSize: 8,
  },
  personalValue: {
    flex: 1,
    color: "#18181b",
    fontSize: 8,
  },
  rowGroup: {
    flexDirection: "row",
    marginBottom: 5,
  },
  dateCol: {
    width: 90,
    paddingRight: 8,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#52525b",
    flexShrink: 0,
  },
  contentCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
  },
  itemSubTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Oblique",
    color: "#4f46e5",
    marginBottom: 1.5,
  },
  text: {
    fontSize: 8,
    color: "#3f3f46",
  },
  bulletList: {
    marginTop: 1,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bulletDot: {
    width: 7,
    fontSize: 8,
    color: "#4f46e5",
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    color: "#3f3f46",
  },
  skillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillBadge: {
    backgroundColor: "#eef2ff",
    color: "#3730a3",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginRight: 3,
    marginBottom: 3,
    borderRadius: 2.5,
  },
  link: {
    color: "#4f46e5",
    textDecoration: "none",
  },
})

interface Props {
  resumeData: ResumeData
  language?: string
}

export function GermanModernLebenslaufTemplate({ resumeData, language }: Props) {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData
  const activeLang = (language || resumeData.language || "en").toLowerCase()
  const isGerman = activeLang.startsWith("de")
  const titles = getResumeSectionTitles(activeLang)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {basicInfo.profilePicture && (
            <View style={styles.photoContainer}>
              <Image src={basicInfo.profilePicture} style={styles.photo} />
            </View>
          )}
          <View style={styles.headerMain}>
            <Text style={styles.name}>{basicInfo.name || "Max Mustermann"}</Text>
            {basicInfo.title ? <Text style={styles.title}>{basicInfo.title}</Text> : null}

            <View style={styles.contactGrid}>
              {basicInfo.email && (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.email} style={styles.icon} />
                  <Text>{basicInfo.email}</Text>
                </View>
              )}
              {basicInfo.phone && (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.phone} style={styles.icon} />
                  <Text>{basicInfo.phone}</Text>
                </View>
              )}
              {basicInfo.location && (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.location} style={styles.icon} />
                  <Text>{basicInfo.location}</Text>
                </View>
              )}
              {basicInfo.linkedin && (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.linkedin} style={styles.icon} />
                  <Link src={basicInfo.linkedin} style={styles.link}>
                    {basicInfo.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
                  </Link>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Persoenliche Angaben */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{titles.contact}</Text>
          <View style={styles.personalGrid}>
            <View style={styles.personalItem}>
              <Text style={styles.personalLabel}>Name:</Text>
              <Text style={styles.personalValue}>{basicInfo.name}</Text>
            </View>
            <View style={styles.personalItem}>
              <Text style={styles.personalLabel}>{titles.location}</Text>
              <Text style={styles.personalValue}>{basicInfo.location || (isGerman ? "Deutschland" : "Germany")}</Text>
            </View>
            <View style={styles.personalItem}>
              <Text style={styles.personalLabel}>{titles.email}</Text>
              <Text style={styles.personalValue}>{basicInfo.email}</Text>
            </View>
            <View style={styles.personalItem}>
              <Text style={styles.personalLabel}>{titles.phone}</Text>
              <Text style={styles.personalValue}>{basicInfo.phone}</Text>
            </View>
          </View>
        </View>

        {/* Profil / Zusammenfassung */}
        {basicInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{titles.summary}</Text>
            <Text style={styles.text}>{basicInfo.summary}</Text>
          </View>
        )}

        {/* Berufserfahrung */}
        {experience && experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{titles.experience}</Text>
            {experience.map((exp, idx) => (
              <View key={idx} style={styles.rowGroup}>
                <Text style={styles.dateCol}>
                  {exp.startDate} – {exp.endDate || titles.present}
                </Text>
                <View style={styles.contentCol}>
                  <Text style={styles.itemTitle}>{exp.position}</Text>
                  <Text style={styles.itemSubTitle}>{exp.company}</Text>
                  {exp.description && <Text style={styles.text}>{exp.description}</Text>}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <View style={styles.bulletList}>
                      {exp.highlights.map((hl, hIdx) => (
                        <View key={hIdx} style={styles.bulletItem}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{hl}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Ausbildung */}
        {education && education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{titles.education}</Text>
            {education.map((edu, eIdx) => (
              <View key={eIdx} style={styles.rowGroup}>
                <Text style={styles.dateCol}>
                  {edu.startDate} – {edu.endDate || titles.present}
                </Text>
                <View style={styles.contentCol}>
                  <Text style={styles.itemTitle}>
                    {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                  </Text>
                  <Text style={styles.itemSubTitle}>{edu.institution}</Text>
                  {edu.gpa && <Text style={styles.text}>{isGerman ? "Note: " : "GPA: "}{edu.gpa}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Kenntnisse & Fähigkeiten */}
        {skills && skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{titles.skills}</Text>
            <View style={styles.skillContainer}>
              {skills.map((skill, sIdx) => (
                <Text key={sIdx} style={styles.skillBadge}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Projekte */}
        {projects && projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{titles.projects}</Text>
            {projects.map((proj, pIdx) => (
              <View key={pIdx} style={styles.rowGroup}>
                <Text style={styles.dateCol}>
                  {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}
                </Text>
                <View style={styles.contentCol}>
                  <Text style={styles.itemTitle}>{proj.name}</Text>
                  {proj.description && <Text style={styles.text}>{proj.description}</Text>}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <Text style={[styles.text, { color: "#4f46e5", marginTop: 2 }]}>
                      {isGerman ? "Technologien:" : "Technologies:"} {proj.technologies.join(", ")}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
