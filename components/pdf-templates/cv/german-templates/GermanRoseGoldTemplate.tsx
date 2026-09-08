import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "@/components/logos/logos"

// German Rose Gold & Slate Lebenslauf (Melanie Schwarz style)
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#27272a",
    backgroundColor: "#ffffff",
    lineHeight: 1.35,
    position: "relative",
  },
  // Top champagne/rose gradient banner
  topBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "#EFE5DC",
  },
  layoutContainer: {
    flexDirection: "row",
    flex: 1,
    zIndex: 1,
  },
  // Left Sidebar
  sidebar: {
    width: "34%",
    backgroundColor: "#7E8288",
    paddingTop: 18,
    paddingBottom: 24,
    paddingLeft: 18,
    paddingRight: 18,
  },
  photoWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  photo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    objectFit: "cover",
    borderWidth: 3,
    borderColor: "#d4d4d8",
  },
  photoPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#63666f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#d4d4d8",
  },
  photoInitials: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  badgeHeader: {
    backgroundColor: "#DFCCC0",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#4a3b32",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  contactIcon: {
    width: 8,
    height: 8,
    marginRight: 6,
    opacity: 0.9,
  },
  contactText: {
    fontSize: 7.5,
    color: "#ffffff",
    flex: 1,
  },
  sidebarSectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
  },
  sidebarSectionIcon: {
    width: 9,
    height: 9,
    marginRight: 5,
  },
  sidebarSectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  ratingName: {
    fontSize: 7.5,
    color: "#ffffff",
    width: "55%",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3,
  },
  dotFilled: {
    backgroundColor: "#ffffff",
  },
  dotEmpty: {
    backgroundColor: "#5a5d63",
  },
  // Right Main Content
  mainContent: {
    width: "66%",
    paddingTop: 18,
    paddingBottom: 24,
    paddingLeft: 22,
    paddingRight: 24,
  },
  headerBox: {
    height: 72,
    justifyContent: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#44403c",
    textTransform: "uppercase",
    letterSpacing: 2,
    lineHeight: 1.1,
  },
  title: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#b08974",
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginTop: 4,
  },
  mainSection: {
    marginBottom: 12,
  },
  mainSectionTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#78716c",
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginBottom: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e7e5e4",
    paddingBottom: 3,
  },
  summaryParagraph: {
    fontSize: 7.8,
    color: "#44403c",
    lineHeight: 1.4,
  },
  experienceItem: {
    marginBottom: 9,
  },
  expHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  expRole: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#1c1917",
    flex: 1,
    marginRight: 8,
  },
  expDate: {
    fontSize: 7.5,
    color: "#78716c",
    flexShrink: 0,
    textAlign: "right",
  },
  expCompany: {
    fontSize: 7.8,
    color: "#57534e",
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
    backgroundColor: "#78716c",
    marginTop: 4,
    marginRight: 4,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 7.8,
    color: "#44403c",
    lineHeight: 1.35,
  },
})

export function GermanRoseGoldTemplate({ resumeData }: { resumeData: ResumeData }) {
  const { basicInfo, experience = [], education = [], skills = [], projects = [], achievements = [] } = resumeData

  // 5 dot rating helper
  const renderDots = (index: number) => {
    const filledCount = index === 0 ? 5 : index === 1 ? 4 : index === 2 ? 3 : 4
    return (
      <View style={styles.dotsContainer}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={[styles.dot, i < filledCount ? styles.dotFilled : styles.dotEmpty]} />
        ))}
      </View>
    )
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Champagne Banner */}
        <View style={styles.topBanner} />

        <View style={styles.layoutContainer}>
          {/* Left Sidebar (34% Slate Grey) */}
          <View style={styles.sidebar}>
            {/* Circular Profile Photo */}
            <View style={styles.photoWrapper}>
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

            {/* Badge: KONTAKT */}
            <View style={styles.badgeHeader}>
              <Text style={styles.badgeText}>Kontakt</Text>
            </View>

            {basicInfo.phone && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.phone} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.phone}</Text>
              </View>
            )}
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
            {basicInfo.website && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.website} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.website.replace(/^https?:\/\//, "")}</Text>
              </View>
            )}

            {/* Badge: KENNTNISSE */}
            <View style={[styles.badgeHeader, { marginTop: 14 }]}>
              <Text style={styles.badgeText}>Kenntnisse</Text>
            </View>

            {/* Languages with Dots */}
            {basicInfo.languages && basicInfo.languages.length > 0 && (
              <View style={{ marginBottom: 10 }}>
                <View style={styles.sidebarSectionTitle}>
                  <Image src={lightIconUrls.languages} style={styles.sidebarSectionIcon} />
                  <Text style={styles.sidebarSectionLabel}>Sprachen</Text>
                </View>
                {basicInfo.languages.map((lang, idx) => {
                  const name = lang.split(/[:\-(]/)[0]?.trim() || lang
                  return (
                    <View key={idx} style={styles.ratingRow}>
                      <Text style={styles.ratingName}>{name}</Text>
                      {renderDots(idx)}
                    </View>
                  )
                })}
              </View>
            )}

            {/* IT-Kenntnisse with Dots */}
            {skills.length > 0 && (
              <View>
                <View style={styles.sidebarSectionTitle}>
                  <Image src={lightIconUrls.code} style={styles.sidebarSectionIcon} />
                  <Text style={styles.sidebarSectionLabel}>IT-Kenntnisse</Text>
                </View>
                {skills.slice(0, 7).map((skill, idx) => (
                  <View key={idx} style={styles.ratingRow}>
                    <Text style={styles.ratingName}>{skill}</Text>
                    {renderDots(idx)}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Main Content (66%) */}
          <View style={styles.mainContent}>
            {/* Header Box aligned with top banner */}
            <View style={styles.headerBox}>
              <Text style={styles.name}>{basicInfo.name || "Lebenslauf"}</Text>
              {basicInfo.title ? <Text style={styles.title}>{basicInfo.title}</Text> : null}
            </View>

            {/* Über mich / Summary */}
            {basicInfo.summary && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Über Mich</Text>
                <Text style={styles.summaryParagraph}>{basicInfo.summary}</Text>
              </View>
            )}

            {/* Berufliche Laufbahn / Experience */}
            {experience.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Berufliche Laufbahn</Text>
                {experience.map((exp, idx) => (
                  <View key={idx} style={styles.experienceItem}>
                    <View style={styles.expHeaderRow}>
                      <Text style={styles.expRole}>{exp.position}</Text>
                      <Text style={styles.expDate}>
                        {exp.startDate || exp.endDate ? `${exp.startDate || ""} - ${exp.endDate || "Aktuell"}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.expCompany}>{exp.company}</Text>
                    {exp.description ? <Text style={styles.summaryParagraph}>{exp.description}</Text> : null}
                    {exp.highlights?.map((h, hIdx) => (
                      <View key={hIdx} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Akademischer Werdegang / Education */}
            {education.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Akademischer Werdegang</Text>
                {education.map((edu, idx) => (
                  <View key={idx} style={styles.experienceItem}>
                    <View style={styles.expHeaderRow}>
                      <Text style={styles.expRole}>{edu.degree} {edu.field ? `in ${edu.field}` : ""}</Text>
                      <Text style={styles.expDate}>
                        {edu.startDate || edu.endDate ? `${edu.startDate || ""} - ${edu.endDate || ""}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.expCompany}>{edu.institution}</Text>
                    {edu.gpa ? <Text style={styles.summaryParagraph}>Abschlussnote: {edu.gpa}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            {/* Projekte / Projects */}
            {projects.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Projekte</Text>
                {projects.map((proj, idx) => (
                  <View key={idx} style={styles.experienceItem}>
                    <Text style={styles.expRole}>{proj.name}</Text>
                    {proj.description ? <Text style={styles.summaryParagraph}>{proj.description}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            {/* Erfolge / Achievements */}
            {achievements.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Erfolge & Auszeichnungen</Text>
                {achievements.map((ach, idx) => (
                  <View key={idx} style={styles.experienceItem}>
                    <Text style={styles.expRole}>{ach.title}</Text>
                    {ach.description ? <Text style={styles.summaryParagraph}>{ach.description}</Text> : null}
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
