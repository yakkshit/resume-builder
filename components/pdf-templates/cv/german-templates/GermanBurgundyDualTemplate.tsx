import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { darkIconUrls } from "@/components/logos/logos"

// German Burgundy Dual Tone Lebenslauf (Martina Kovac style)
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#1f2937",
    backgroundColor: "#ffffff",
    lineHeight: 1.35,
    position: "relative",
  },
  // Top-left soft blush patch
  blushPatch: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 175,
    height: 155,
    backgroundColor: "#F7ECE9",
  },
  layout: {
    flexDirection: "row",
    flex: 1,
    zIndex: 1,
  },
  // Left Sidebar
  sidebar: {
    width: "33%",
    paddingTop: 18,
    paddingBottom: 24,
    paddingLeft: 22,
    paddingRight: 16,
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  photo: {
    width: 95,
    height: 115,
    borderRadius: 2,
    objectFit: "cover",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  photoPlaceholder: {
    width: 95,
    height: 115,
    backgroundColor: "#e2d2ce",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
  },
  photoInitials: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#802035",
  },
  sidebarSection: {
    marginBottom: 14,
  },
  sidebarSectionHeader: {
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#802035",
    paddingVertical: 2.5,
    marginBottom: 6,
  },
  sidebarSectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4.5,
  },
  contactIcon: {
    width: 8,
    height: 8,
    marginRight: 6,
    marginTop: 2,
    opacity: 0.8,
  },
  contactText: {
    fontSize: 7.5,
    color: "#374151",
    flex: 1,
    lineHeight: 1.25,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 3.5,
  },
  bulletDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: "#802035",
    marginTop: 4,
    marginRight: 5,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 7.5,
    color: "#374151",
    lineHeight: 1.3,
    flex: 1,
  },
  // Right Main Column
  mainContent: {
    width: "67%",
    paddingTop: 18,
    paddingBottom: 24,
    paddingLeft: 18,
    paddingRight: 26,
  },
  headerBox: {
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    letterSpacing: 0.8,
  },
  targetTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#802035",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  burgundyBar: {
    height: 3,
    backgroundColor: "#802035",
    marginTop: 6,
    marginBottom: 10,
  },
  mainSection: {
    marginBottom: 11,
  },
  mainSectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  sectionDivider: {
    height: 0.8,
    backgroundColor: "#802035",
    marginTop: 2,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 7.8,
    color: "#374151",
    lineHeight: 1.4,
  },
  entryRow: {
    flexDirection: "row",
    marginBottom: 7,
  },
  entryDateCol: {
    width: 80,
    paddingRight: 8,
  },
  entryDateText: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: "#4b5563",
    lineHeight: 1.2,
  },
  entryContentCol: {
    flex: 1,
  },
  entryHeading: {
    fontSize: 8.2,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  entrySubHeading: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Oblique",
    color: "#4b5563",
    marginBottom: 2,
  },
  twoColGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  twoColItem: {
    width: "48%",
    marginRight: "2%",
    marginBottom: 4,
  },
  // Language Gauge
  languageRow: {
    marginBottom: 5,
  },
  languageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  languageName: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  languageLevel: {
    fontSize: 7.2,
    color: "#4b5563",
  },
  gaugeContainer: {
    flexDirection: "row",
    marginTop: 1,
  },
  gaugeSegment: {
    height: 3.5,
    flex: 1,
    marginRight: 2,
    borderRadius: 1,
  },
  gaugeFilled: {
    backgroundColor: "#802035",
  },
  gaugeEmpty: {
    backgroundColor: "#e5e7eb",
  },
})

export function GermanBurgundyDualTemplate({ resumeData }: { resumeData: ResumeData }) {
  const { basicInfo, experience = [], education = [], skills = [], projects = [], achievements = [] } = resumeData

  // Partition skills: strengths for sidebar, technical skills for main section
  const halfSkills = Math.ceil(skills.length / 2)
  const sidebarStrengths = skills.slice(0, Math.min(4, halfSkills))
  const mainSkills = skills.slice(Math.min(4, halfSkills))

  const renderGauge = (index: number) => {
    const filledCount = index === 0 ? 5 : index === 1 ? 4 : 3
    return (
      <View style={styles.gaugeContainer}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[styles.gaugeSegment, i < filledCount ? styles.gaugeFilled : styles.gaugeEmpty]}
          />
        ))}
      </View>
    )
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Soft Blush Header Patch */}
        <View style={styles.blushPatch} />

        <View style={styles.layout}>
          {/* Left Sidebar (33%) */}
          <View style={styles.sidebar}>
            {/* Profile Photo */}
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

            {/* Kontakt Section */}
            <View style={styles.sidebarSection}>
              <View style={styles.sidebarSectionHeader}>
                <Text style={styles.sidebarSectionTitle}>Kontakt</Text>
              </View>
              {basicInfo.location && (
                <View style={styles.contactItem}>
                  <Image src={darkIconUrls.location} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{basicInfo.location}</Text>
                </View>
              )}
              {basicInfo.phone && (
                <View style={styles.contactItem}>
                  <Image src={darkIconUrls.phone} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{basicInfo.phone}</Text>
                </View>
              )}
              {basicInfo.email && (
                <View style={styles.contactItem}>
                  <Image src={darkIconUrls.email} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{basicInfo.email}</Text>
                </View>
              )}
              {basicInfo.website && (
                <View style={styles.contactItem}>
                  <Image src={darkIconUrls.website} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{basicInfo.website.replace(/^https?:\/\//, "")}</Text>
                </View>
              )}
            </View>

            {/* Persönliche Stärken / Strengths */}
            {sidebarStrengths.length > 0 && (
              <View style={styles.sidebarSection}>
                <View style={styles.sidebarSectionHeader}>
                  <Text style={styles.sidebarSectionTitle}>Persönliche Stärken</Text>
                </View>
                {sidebarStrengths.map((skill, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Ehrenamtliche Tätigkeit / Achievements */}
            {achievements.length > 0 && (
              <View style={styles.sidebarSection}>
                <View style={styles.sidebarSectionHeader}>
                  <Text style={styles.sidebarSectionTitle}>Ehrenamt / Erfolge</Text>
                </View>
                {achievements.map((ach, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>
                      {ach.title} {ach.description ? `(${ach.description})` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Main Content (67%) */}
          <View style={styles.mainContent}>
            {/* Header */}
            <View style={styles.headerBox}>
              <Text style={styles.name}>{basicInfo.name || "Martina Kovac"}</Text>
              {basicInfo.title ? <Text style={styles.targetTitle}>{basicInfo.title}</Text> : null}
              <View style={styles.burgundyBar} />
            </View>

            {/* Profil / Summary */}
            {basicInfo.summary && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Profil</Text>
                <Text style={styles.summaryText}>{basicInfo.summary}</Text>
                <View style={styles.sectionDivider} />
              </View>
            )}

            {/* Bildungsweg / Education */}
            {education.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Bildungsweg</Text>
                {education.map((edu, idx) => (
                  <View key={idx} style={styles.entryRow}>
                    <View style={styles.entryDateCol}>
                      <Text style={styles.entryDateText}>
                        {edu.startDate || edu.endDate ? `${edu.startDate || ""} - ${edu.endDate || ""}` : ""}
                      </Text>
                    </View>
                    <View style={styles.entryContentCol}>
                      <Text style={styles.entryHeading}>{edu.institution}</Text>
                      <Text style={styles.entrySubHeading}>{edu.degree} {edu.field ? `- ${edu.field}` : ""}</Text>
                      {edu.gpa ? <Text style={styles.summaryText}>Abschlussnote: {edu.gpa}</Text> : null}
                    </View>
                  </View>
                ))}
                <View style={styles.sectionDivider} />
              </View>
            )}

            {/* Praxiserfahrung / Experience */}
            {experience.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Praxiserfahrung</Text>
                {experience.map((exp, idx) => (
                  <View key={idx} style={styles.entryRow}>
                    <View style={styles.entryDateCol}>
                      <Text style={styles.entryDateText}>
                        {exp.startDate || exp.endDate ? `${exp.startDate || ""} - ${exp.endDate || "Aktuell"}` : ""}
                      </Text>
                    </View>
                    <View style={styles.entryContentCol}>
                      <Text style={styles.entryHeading}>{exp.position}</Text>
                      <Text style={styles.entrySubHeading}>{exp.company}</Text>
                      {exp.description ? <Text style={styles.summaryText}>{exp.description}</Text> : null}
                      {exp.highlights?.map((h, hIdx) => (
                        <View key={hIdx} style={styles.bulletItem}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{h}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                <View style={styles.sectionDivider} />
              </View>
            )}

            {/* Kompetenzen / Skills */}
            {mainSkills.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Kompetenzen</Text>
                <View style={styles.twoColGrid}>
                  {mainSkills.map((skill, idx) => (
                    <View key={idx} style={styles.twoColItem}>
                      <View style={styles.bulletItem}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{skill}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.sectionDivider} />
              </View>
            )}

            {/* Sprachen / Languages */}
            {basicInfo.languages && basicInfo.languages.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Sprachen</Text>
                {basicInfo.languages.map((lang, idx) => {
                  const parts = lang.split(/[:\-(]/)
                  const name = parts[0]?.trim() || lang
                  const level = parts[1]?.replace(/[)]/g, "").trim() || (idx === 0 ? "Muttersprache" : "B2")
                  return (
                    <View key={idx} style={styles.languageRow}>
                      <View style={styles.languageHeader}>
                        <Text style={styles.languageName}>{name}</Text>
                        <Text style={styles.languageLevel}>{level}</Text>
                      </View>
                      {renderGauge(idx)}
                    </View>
                  )
                })}
              </View>
            )}

            {/* Projects (if present) */}
            {projects.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Projekte</Text>
                {projects.map((proj, idx) => (
                  <View key={idx} style={{ marginBottom: 4 }}>
                    <Text style={styles.entryHeading}>{proj.name}</Text>
                    {proj.description ? <Text style={styles.summaryText}>{proj.description}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}
