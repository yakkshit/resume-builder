import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "@/components/logos/logos"

// Modern German Lebenslauf layout with dark accent header and structured table-like sections
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#27272a",
    backgroundColor: "#ffffff",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#18181b",
    paddingBottom: 15,
    marginBottom: 15,
    alignItems: "center",
  },
  photoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: "#3f3f46",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    objectFit: "cover",
  },
  headerMain: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
    marginBottom: 2,
    lineHeight: 1.2,
  },
  title: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    lineHeight: 1.25,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: 8.5,
    color: "#52525b",
    marginRight: 10,
    marginBottom: 4,
  },
  icon: {
    width: 9,
    height: 9,
    marginRight: 4,
  },
  section: {
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    backgroundColor: "#f4f4f5",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
  },
  personalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  personalItem: {
    flexDirection: "row",
    width: "48%",
    marginBottom: 4,
    marginRight: "2%",
  },
  personalLabel: {
    width: 80,
    fontFamily: "Helvetica-Bold",
    color: "#71717a",
    fontSize: 8.5,
  },
  personalValue: {
    flex: 1,
    color: "#18181b",
    fontSize: 8.5,
  },
  rowGroup: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dateCol: {
    width: 95,
    paddingRight: 10,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#52525b",
    flexShrink: 0,
  },
  contentCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#09090b",
  },
  itemSubTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Oblique",
    color: "#4f46e5",
    marginBottom: 2,
  },
  text: {
    fontSize: 8.5,
    color: "#3f3f46",
  },
  bulletList: {
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 1.5,
  },
  bulletDot: {
    width: 8,
    fontSize: 8.5,
    color: "#4f46e5",
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: "#3f3f46",
  },
  skillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillBadge: {
    backgroundColor: "#eef2ff",
    color: "#3730a3",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    borderRadius: 3,
  },
  link: {
    color: "#4f46e5",
    textDecoration: "none",
  },
})

interface Props {
  resumeData: ResumeData
}

export function GermanModernLebenslaufTemplate({ resumeData }: Props) {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

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
          <Text style={styles.sectionTitle}>Persönliche Daten</Text>
          <View style={styles.personalGrid}>
            <View style={styles.personalItem}>
              <Text style={styles.personalLabel}>Name:</Text>
              <Text style={styles.personalValue}>{basicInfo.name}</Text>
            </View>
            <View style={styles.personalItem}>
              <Text style={styles.personalLabel}>Wohnort:</Text>
              <Text style={styles.personalValue}>{basicInfo.location || "Deutschland"}</Text>
            </View>
            <View style={styles.personalItem}>
              <Text style={styles.personalLabel}>E-Mail:</Text>
              <Text style={styles.personalValue}>{basicInfo.email}</Text>
            </View>
            <View style={styles.personalItem}>
              <Text style={styles.personalLabel}>Telefon:</Text>
              <Text style={styles.personalValue}>{basicInfo.phone}</Text>
            </View>
          </View>
        </View>

        {/* Profil / Zusammenfassung */}
        {basicInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil</Text>
            <Text style={styles.text}>{basicInfo.summary}</Text>
          </View>
        )}

        {/* Berufserfahrung */}
        {experience && experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Berufserfahrung</Text>
            {experience.map((exp, idx) => (
              <View key={idx} style={styles.rowGroup}>
                <Text style={styles.dateCol}>
                  {exp.startDate} – {exp.endDate || "Heute"}
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
            <Text style={styles.sectionTitle}>Ausbildung</Text>
            {education.map((edu, eIdx) => (
              <View key={eIdx} style={styles.rowGroup}>
                <Text style={styles.dateCol}>
                  {edu.startDate} – {edu.endDate || "Heute"}
                </Text>
                <View style={styles.contentCol}>
                  <Text style={styles.itemTitle}>
                    {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                  </Text>
                  <Text style={styles.itemSubTitle}>{edu.institution}</Text>
                  {edu.gpa && <Text style={styles.text}>Note: {edu.gpa}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Kenntnisse & Fähigkeiten */}
        {skills && skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kenntnisse & Fähigkeiten</Text>
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
            <Text style={styles.sectionTitle}>Projekte</Text>
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
                      Technologien: {proj.technologies.join(", ")}
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
