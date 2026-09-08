import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls, darkIconUrls } from "@/components/logos/logos"

// German Slate Split Lebenslauf (Paul Schmidt style)
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#27272a",
    backgroundColor: "#ffffff",
    lineHeight: 1.35,
    flexDirection: "row",
  },
  leftColumn: {
    width: "60%",
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 30,
    paddingRight: 20,
    backgroundColor: "#ffffff",
  },
  rightSidebar: {
    width: "40%",
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: "#95A3B3",
    color: "#ffffff",
  },
  // Left Header
  nameHeader: {
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e4e4e7",
    paddingBottom: 12,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    lineHeight: 1.1,
  },
  title: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Oblique",
    color: "#52525b",
    marginTop: 3,
    letterSpacing: 0.5,
  },
  // Left Section Titles
  leftSection: {
    marginBottom: 16,
  },
  leftSectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 10,
  },
  // Timeline entry with left dates and right content
  timelineRow: {
    flexDirection: "row",
    marginBottom: 11,
  },
  dateColumn: {
    width: 65,
    paddingRight: 8,
  },
  dateText: {
    fontSize: 7.5,
    color: "#52525b",
    lineHeight: 1.25,
  },
  contentColumn: {
    flex: 1,
  },
  itemRole: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#18181b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  itemCompany: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#3f3f46",
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 7.8,
    color: "#52525b",
    lineHeight: 1.35,
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: "#71717a",
    marginTop: 4,
    marginRight: 4,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 7.8,
    color: "#52525b",
    lineHeight: 1.35,
  },
  // Right Sidebar Elements
  photoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  photo: {
    width: 110,
    height: 125,
    objectFit: "cover",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#b0bcc9",
  },
  photoPlaceholder: {
    width: 110,
    height: 125,
    backgroundColor: "#7b8a9b",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitials: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  contactList: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  contactIcon: {
    width: 8.5,
    height: 8.5,
    marginRight: 6,
    opacity: 0.9,
  },
  contactText: {
    fontSize: 7.8,
    color: "#f4f4f5",
    flex: 1,
  },
  sidebarSection: {
    marginBottom: 14,
  },
  sidebarSectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  sidebarSummaryText: {
    fontSize: 7.8,
    color: "#1e293b",
    lineHeight: 1.35,
  },
  sidebarBulletRow: {
    flexDirection: "row",
    marginBottom: 3.5,
  },
  sidebarBulletDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: "#1e293b",
    marginTop: 4,
    marginRight: 5,
    flexShrink: 0,
  },
  sidebarBulletText: {
    flex: 1,
    fontSize: 7.8,
    color: "#1e293b",
    lineHeight: 1.3,
  },
})

export function GermanSlateSplitTemplate({ resumeData }: { resumeData: ResumeData }) {
  const { basicInfo, experience = [], education = [], skills = [], projects = [], achievements = [] } = resumeData

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Left Column (60%) */}
        <View style={styles.leftColumn}>
          {/* Header */}
          <View style={styles.nameHeader}>
            <Text style={styles.name}>{basicInfo.name || "Lebenslauf"}</Text>
            {basicInfo.title ? <Text style={styles.title}>{basicInfo.title}</Text> : null}
          </View>

          {/* Experience */}
          {experience.length > 0 && (
            <View style={styles.leftSection}>
              <Text style={styles.leftSectionTitle}>Erfahrung</Text>
              {experience.map((exp, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  {/* Left Date Column */}
                  <View style={styles.dateColumn}>
                    <Text style={styles.dateText}>{exp.startDate || ""}</Text>
                    <Text style={styles.dateText}>{exp.endDate || "Aktuell"}</Text>
                  </View>

                  {/* Right Content Column */}
                  <View style={styles.contentColumn}>
                    <Text style={styles.itemRole}>{exp.position}</Text>
                    <Text style={styles.itemCompany}>
                      {exp.company}
                    </Text>
                    {exp.description ? <Text style={styles.itemDescription}>{exp.description}</Text> : null}
                    {exp.highlights?.map((h, hIdx) => (
                      <View key={hIdx} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {education.length > 0 && (
            <View style={styles.leftSection}>
              <Text style={styles.leftSectionTitle}>Ausbildung</Text>
              {education.map((edu, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.dateColumn}>
                    <Text style={styles.dateText}>{edu.startDate || ""}</Text>
                    <Text style={styles.dateText}>{edu.endDate || ""}</Text>
                  </View>
                  <View style={styles.contentColumn}>
                    <Text style={styles.itemRole}>{edu.degree} {edu.field ? `in ${edu.field}` : ""}</Text>
                    <Text style={styles.itemCompany}>{edu.institution}</Text>
                    {edu.gpa ? <Text style={styles.itemDescription}>Abschlussnote: {edu.gpa}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <View style={styles.leftSection}>
              <Text style={styles.leftSectionTitle}>Projekte</Text>
              {projects.map((proj, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.dateColumn}>
                    <Text style={styles.dateText}>{proj.startDate || proj.endDate || ""}</Text>
                  </View>
                  <View style={styles.contentColumn}>
                    <Text style={styles.itemRole}>{proj.name}</Text>
                    {proj.description ? <Text style={styles.itemDescription}>{proj.description}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right Sidebar (40% Slate Blue) */}
        <View style={styles.rightSidebar}>
          {/* Profile Picture */}
          <View style={styles.photoContainer}>
            {basicInfo.profilePicture ? (
              <Image src={basicInfo.profilePicture} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoInitials}>
                  {basicInfo.name
                    ? basicInfo.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "CV"}
                </Text>
              </View>
            )}
          </View>

          {/* Contact Info */}
          <View style={styles.contactList}>
            {basicInfo.email && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.email} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.email}</Text>
              </View>
            )}
            {basicInfo.location && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.location} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.location}</Text>
              </View>
            )}
            {basicInfo.phone && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.phone} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.phone}</Text>
              </View>
            )}
            {basicInfo.website && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.website} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.website.replace(/^https?:\/\//, "")}</Text>
              </View>
            )}
            {basicInfo.linkedin && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.linkedin} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.linkedin.replace(/^https?:\/\//, "")}</Text>
              </View>
            )}
          </View>

          {/* Summary / Betreff */}
          {basicInfo.summary && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Betreff</Text>
              <Text style={styles.sidebarSummaryText}>{basicInfo.summary}</Text>
            </View>
          )}

          {/* Skills / Fähigkeiten */}
          {skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Fähigkeiten</Text>
              {skills.map((skill, idx) => (
                <View key={idx} style={styles.sidebarBulletRow}>
                  <View style={styles.sidebarBulletDot} />
                  <Text style={styles.sidebarBulletText}>{skill}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Languages / Sprachen */}
          {basicInfo.languages && basicInfo.languages.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Sprachen</Text>
              {basicInfo.languages.map((lang, idx) => {
                const parts = lang.split(/[:\-(]/)
                const name = parts[0]?.trim() || lang
                const level = parts[1]?.replace(/[)]/g, "").trim() || (idx === 0 ? "Muttersprache" : "Fortgeschritten")
                return (
                  <View key={idx} style={styles.sidebarBulletRow}>
                    <View style={styles.sidebarBulletDot} />
                    <Text style={styles.sidebarBulletText}>
                      {name} | {level}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* Achievements (if any) */}
          {achievements.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Erfolge</Text>
              {achievements.map((ach, idx) => (
                <View key={idx} style={styles.sidebarBulletRow}>
                  <View style={styles.sidebarBulletDot} />
                  <Text style={styles.sidebarBulletText}>
                    {ach.title} {ach.description ? `(${ach.description})` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
