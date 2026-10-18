import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { darkIconUrls } from "@/components/logos/logos"
import { getResumeSectionTitles } from "@/lib/resume-section-titles"

// German Minimal Timeline Lebenslauf (Maximilian Muster style)
const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingLeft: 36,
    paddingRight: 36,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#374151",
    backgroundColor: "#ffffff",
    lineHeight: 1.35,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  photoContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    flexShrink: 0,
  },
  photo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    objectFit: "cover",
  },
  photoPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitials: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#4b5563",
  },
  headerTitles: {
    flex: 1,
    justifyContent: "center",
  },
  headerCategory: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  mainHeaderName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
    marginBottom: 3,
    lineHeight: 1.15,
  },
  headerJobTitle: {
    fontSize: 9.5,
    color: "#4b5563",
    lineHeight: 1.25,
  },
  headerRight: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  contactIcon: {
    width: 7.5,
    height: 7.5,
    marginRight: 5,
    opacity: 0.7,
  },
  contactText: {
    fontSize: 7.5,
    color: "#6b7280",
  },
  // Timeline Section
  sectionBlock: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    width: "30%",
  },
  // Timeline Entry
  timelineItem: {
    flexDirection: "row",
    marginBottom: 10,
    position: "relative",
  },
  timelineLeft: {
    width: "29%",
    paddingRight: 12,
  },
  leftCompany: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
    lineHeight: 1.25,
  },
  leftDate: {
    fontSize: 7.5,
    color: "#6b7280",
    marginTop: 2,
  },
  // Center Timeline Track & Dot
  timelineCenter: {
    width: "4%",
    alignItems: "center",
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    top: 0,
    bottom: -10,
    left: "50%",
    width: 1,
    backgroundColor: "#d1d5db",
  },
  timelineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#6b7280",
    marginTop: 3,
    zIndex: 1,
  },
  timelineRight: {
    width: "67%",
    paddingLeft: 10,
  },
  itemTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 7.8,
    color: "#4b5563",
    lineHeight: 1.35,
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDash: {
    fontSize: 7.8,
    color: "#6b7280",
    marginRight: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 7.8,
    color: "#4b5563",
    lineHeight: 1.35,
  },
  // Skills 3-Column Grid
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "67%",
    paddingLeft: 10,
  },
  skillCard: {
    width: "31%",
    marginRight: "2%",
    marginBottom: 8,
  },
  skillName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
  },
  skillLevel: {
    fontSize: 7.2,
    color: "#6b7280",
    marginTop: 1,
  },
})

export function GermanTimelineMinimalTemplate({ resumeData, language }: { resumeData: ResumeData; language?: string }) {
  const { basicInfo, experience = [], education = [], skills = [], projects = [], achievements = [] } = resumeData
  const titles = getResumeSectionTitles(language || resumeData.language)

  const skillLevels = [titles.skills, "Advanced", "Proficient", "Intermediate", "Skilled"]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
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
            <View style={styles.headerTitles}>
              <Text style={styles.headerCategory}>{titles.contact === "Kontakt" ? "LEBENSLAUF" : "CURRICULUM VITAE"}</Text>
              <Text style={styles.mainHeaderName}>{basicInfo.name || "Lebenslauf"}</Text>
              {basicInfo.title ? <Text style={styles.headerJobTitle}>{basicInfo.title}</Text> : null}
            </View>
          </View>

          {/* Right Contact Info */}
          <View style={styles.headerRight}>
            {basicInfo.location && (
              <View style={styles.contactItem}>
                <Image src={darkIconUrls.location} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.location}</Text>
              </View>
            )}
            {basicInfo.email && (
              <View style={styles.contactItem}>
                <Image src={darkIconUrls.email} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.email}</Text>
              </View>
            )}
            {basicInfo.phone && (
              <View style={styles.contactItem}>
                <Image src={darkIconUrls.phone} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.phone}</Text>
              </View>
            )}
            {basicInfo.website && (
              <View style={styles.contactItem}>
                <Image src={darkIconUrls.website} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.website.replace(/^https?:\/\//, "")}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Summary (if present) */}
        {basicInfo.summary && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeaderLabel}>{titles.summary}</Text>
              <View style={{ width: "70%", paddingLeft: 10 }}>
                <Text style={styles.itemDescription}>{basicInfo.summary}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Experience Section */}
        {experience.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeaderLabel}>{titles.experience}</Text>
            </View>
            {experience.map((exp, idx) => (
              <View key={idx} style={styles.timelineItem}>
                {/* Left side: Company & Dates */}
                <View style={styles.timelineLeft}>
                  <Text style={styles.leftCompany}>{exp.company}</Text>
                  <Text style={styles.leftDate}>
                    {exp.startDate || exp.endDate ? `${exp.startDate || ""} - ${exp.endDate || titles.present}` : ""}
                  </Text>
                </View>

                {/* Center: Timeline line & dot */}
                <View style={styles.timelineCenter}>
                  {idx < experience.length - 1 && <View style={styles.timelineLine} />}
                  <View style={styles.timelineDot} />
                </View>

                {/* Right side: Position & Bullets */}
                <View style={styles.timelineRight}>
                  <Text style={styles.itemTitle}>{exp.position}</Text>
                  {exp.description ? <Text style={styles.itemDescription}>{exp.description}</Text> : null}
                  {exp.highlights?.map((h, hIdx) => (
                    <View key={hIdx} style={styles.bulletRow}>
                      <Text style={styles.bulletDash}>-</Text>
                      <Text style={styles.bulletText}>{h}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeaderLabel}>{titles.education}</Text>
            </View>
            {education.map((edu, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.leftCompany}>{edu.institution}</Text>
                  <Text style={styles.leftDate}>
                    {edu.startDate || edu.endDate ? `${edu.startDate || ""} - ${edu.endDate || ""}` : ""}
                  </Text>
                </View>

                <View style={styles.timelineCenter}>
                  {idx < education.length - 1 && <View style={styles.timelineLine} />}
                  <View style={styles.timelineDot} />
                </View>

                <View style={styles.timelineRight}>
                  <Text style={styles.itemTitle}>{edu.degree} {edu.field ? `in ${edu.field}` : ""}</Text>
                  {edu.gpa ? <Text style={styles.itemDescription}>GPA: {edu.gpa}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills Section (3-column grid) */}
        {skills.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeaderLabel}>{titles.skills}</Text>
              <View style={styles.skillsGrid}>
                {skills.map((skill, idx) => (
                  <View key={idx} style={styles.skillCard}>
                    <Text style={styles.skillName}>{skill}</Text>
                    <Text style={styles.skillLevel}>{skillLevels[idx % skillLevels.length]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Languages (if present) */}
        {basicInfo.languages && basicInfo.languages.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeaderLabel}>{titles.languages}</Text>
              <View style={styles.skillsGrid}>
                {basicInfo.languages.map((lang, idx) => {
                  const parts = lang.split(/[:\-(]/)
                  const name = parts[0]?.trim() || lang
                  const level = parts[1]?.replace(/[)]/g, "").trim() || (idx === 0 ? "Native" : "Fluent")
                  return (
                    <View key={idx} style={styles.skillCard}>
                      <Text style={styles.skillName}>{name}</Text>
                      <Text style={styles.skillLevel}>{level}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          </View>
        )}

        {/* Projects / Achievements */}
        {projects.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeaderLabel}>{titles.projects}</Text>
            </View>
            {projects.map((proj, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <Text style={styles.leftCompany}>{proj.name}</Text>
                </View>
                <View style={styles.timelineCenter}>
                  <View style={styles.timelineDot} />
                </View>
                <View style={styles.timelineRight}>
                  {proj.description ? <Text style={styles.itemDescription}>{proj.description}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
