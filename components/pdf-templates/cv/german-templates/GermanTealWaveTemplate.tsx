import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"

// German Teal Wave Lebenslauf (Jennifer Beyer style)
const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 28,
    paddingRight: 28,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#222222",
    backgroundColor: "#ffffff",
    lineHeight: 1.35,
    position: "relative",
  },
  // Top right organic curve background
  topRightCurve: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 200,
    height: 140,
    zIndex: 0,
  },
  bottomLeftCurve: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 140,
    height: 90,
    zIndex: 0,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    zIndex: 1,
    minHeight: 110,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 15,
    justifyContent: "center",
    paddingTop: 10,
  },
  nameFirst: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#1e6b66",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    lineHeight: 1.05,
  },
  nameLast: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#1e6b66",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
    lineHeight: 1.05,
  },
  singleName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#1e6b66",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
    lineHeight: 1.1,
  },
  targetTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#2e8b84",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  contactBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
  },
  contactText: {
    fontSize: 8,
    color: "#374151",
  },
  contactSeparator: {
    fontSize: 8,
    color: "#1e6b66",
    marginHorizontal: 5,
  },
  photoContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 2,
  },
  photo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    objectFit: "cover",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  photoPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#2e8b84",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  photoInitials: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
  },
  headerDivider: {
    borderBottomWidth: 2,
    borderBottomColor: "#1e6b66",
    marginTop: 6,
    marginBottom: 14,
  },
  columnsContainer: {
    flexDirection: "row",
    flex: 1,
    zIndex: 1,
  },
  leftColumn: {
    width: "63%",
    paddingRight: 14,
  },
  verticalDivider: {
    width: 1.5,
    backgroundColor: "#1e6b66",
    marginRight: 14,
  },
  rightColumn: {
    width: "35%",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 8.2,
    color: "#374151",
    lineHeight: 1.4,
    marginBottom: 4,
  },
  entryContainer: {
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 8.8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  entrySubtitle: {
    fontSize: 7.8,
    color: "#4b5563",
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#1e6b66",
    marginTop: 4,
    marginRight: 5,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.35,
  },
  // Right column elements
  languageItem: {
    marginBottom: 6,
  },
  languageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  languageName: {
    fontSize: 8.2,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  languageLevelText: {
    fontSize: 7.5,
    color: "#4b5563",
  },
  pillsRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  pill: {
    height: 4.5,
    width: 14,
    borderRadius: 2,
    marginRight: 3,
  },
  pillFilled: {
    backgroundColor: "#1e6b66",
  },
  pillEmpty: {
    backgroundColor: "#e5e7eb",
  },
  skillBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3.5,
  },
  skillBulletDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#1e6b66",
    marginTop: 4,
    marginRight: 5,
    flexShrink: 0,
  },
  skillText: {
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.3,
    flex: 1,
  },
})

export function GermanTealWaveTemplate({ resumeData }: { resumeData: ResumeData }) {
  const { basicInfo, experience = [], education = [], skills = [], projects = [], achievements = [] } = resumeData

  // Split name for dramatic 2-line layout if two words
  const nameParts = (basicInfo.name || "").trim().split(/\s+/)
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : basicInfo.name
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""

  // Contact items for single line
  const contactParts: string[] = []
  if (basicInfo.phone) contactParts.push(basicInfo.phone)
  if (basicInfo.email) contactParts.push(basicInfo.email)
  if (basicInfo.location) contactParts.push(basicInfo.location)
  if (basicInfo.website) contactParts.push(basicInfo.website.replace(/^https?:\/\//, ""))

  // Partition skills for Software vs Competencies if many
  const halfSkills = Math.ceil(skills.length / 2)
  const softwareSkills = skills.slice(0, halfSkills)
  const softSkills = skills.slice(halfSkills)

  // Language rating pills helper (default 4/5 or 5/5)
  const getLanguagePills = (index: number) => {
    const filledCount = index === 0 ? 5 : index === 1 ? 4 : 3
    return Array.from({ length: 5 }).map((_, i) => (
      <View key={i} style={[styles.pill, i < filledCount ? styles.pillFilled : styles.pillEmpty]} />
    ))
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Right Decorative Teal Wave Background */}
        <View style={styles.topRightCurve}>
          <Svg width="200" height="140" viewBox="0 0 200 140">
            <Path
              d="M 50 0 C 100 60 140 100 200 110 L 200 0 Z"
              fill="#1e6b66"
            />
            <Path
              d="M 0 0 C 70 50 120 80 200 70 L 200 0 Z"
              fill="#2a807a"
              opacity={0.35}
            />
          </Svg>
        </View>

        {/* Bottom Left Decorative Teal Accent */}
        <View style={styles.bottomLeftCurve}>
          <Svg width="140" height="90" viewBox="0 0 140 90">
            <Path
              d="M 0 90 L 0 30 C 40 40 80 70 120 90 Z"
              fill="#1e6b66"
              opacity={0.85}
            />
          </Svg>
        </View>

        {/* Header with Name, Contact and Photo */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {lastName ? (
              <>
                <Text style={styles.nameFirst}>{firstName}</Text>
                <Text style={styles.nameLast}>{lastName}</Text>
              </>
            ) : (
              <Text style={styles.singleName}>{basicInfo.name || "Lebenslauf"}</Text>
            )}

            {basicInfo.title ? <Text style={styles.targetTitle}>{basicInfo.title}</Text> : null}

            <View style={styles.contactBar}>
              {contactParts.map((item, idx) => (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center" }}>
                  {idx > 0 && <Text style={styles.contactSeparator}>|</Text>}
                  <Text style={styles.contactText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Top-Right Profile Photo */}
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
        </View>

        {/* Teal Horizontal Divider */}
        <View style={styles.headerDivider} />

        {/* Main Content Two Columns */}
        <View style={styles.columnsContainer}>
          {/* Left Column (63% width) */}
          <View style={styles.leftColumn}>
            {/* Summary */}
            {basicInfo.summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Zusammenfassung</Text>
                <Text style={styles.summaryText}>{basicInfo.summary}</Text>
              </View>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Berufserfahrung</Text>
                {experience.map((exp, idx) => (
                  <View key={idx} style={styles.entryContainer}>
                    <Text style={styles.entryTitle}>{exp.position}</Text>
                    <Text style={styles.entrySubtitle}>
                      {exp.company}
                      {exp.company && (exp.startDate || exp.endDate) ? " | " : ""}
                      {exp.startDate || exp.endDate ? `${exp.startDate || ""} - ${exp.endDate || "Aktuell"}` : ""}
                    </Text>
                    {exp.description ? <Text style={styles.summaryText}>{exp.description}</Text> : null}
                    {exp.highlights?.map((highlight, hIdx) => (
                      <View key={hIdx} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{highlight}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Education */}
            {education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ausbildung</Text>
                {education.map((edu, idx) => (
                  <View key={idx} style={styles.entryContainer}>
                    <Text style={styles.entryTitle}>{edu.degree} {edu.field ? `- ${edu.field}` : ""}</Text>
                    <Text style={styles.entrySubtitle}>
                      {edu.institution}
                      {edu.institution && (edu.startDate || edu.endDate) ? " | " : ""}
                      {edu.startDate || edu.endDate ? `${edu.startDate || ""} - ${edu.endDate || ""}` : ""}
                    </Text>
                    {edu.gpa ? <Text style={styles.summaryText}>Abschlussnote: {edu.gpa}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            {/* Projects (if available) */}
            {projects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Projekte</Text>
                {projects.map((proj, idx) => (
                  <View key={idx} style={styles.entryContainer}>
                    <Text style={styles.entryTitle}>{proj.name}</Text>
                    {proj.description ? <Text style={styles.summaryText}>{proj.description}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Vertical Dividing Line */}
          <View style={styles.verticalDivider} />

          {/* Right Column (35% width) */}
          <View style={styles.rightColumn}>
            {/* Languages */}
            {basicInfo.languages && basicInfo.languages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sprachen</Text>
                {basicInfo.languages.map((lang, idx) => {
                  const parts = lang.split(/[:\-(]/)
                  const name = parts[0]?.trim() || lang
                  const level = parts[1]?.replace(/[)]/g, "").trim() || (idx === 0 ? "Muttersprache" : idx === 1 ? "Fließend (C1)" : "Gut (B2)")
                  return (
                    <View key={idx} style={styles.languageItem}>
                      <View style={styles.languageHeader}>
                        <Text style={styles.languageName}>{name}</Text>
                        <Text style={styles.languageLevelText}>{level}</Text>
                      </View>
                      <View style={styles.pillsRow}>{getLanguagePills(idx)}</View>
                    </View>
                  )
                })}
              </View>
            )}

            {/* Software / Skills */}
            {softwareSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Software & IT</Text>
                {softwareSkills.map((skill, idx) => (
                  <View key={idx} style={styles.skillBulletRow}>
                    <View style={styles.skillBulletDot} />
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Competencies / Soft Skills */}
            {softSkills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kompetenzen</Text>
                {softSkills.map((skill, idx) => (
                  <View key={idx} style={styles.skillBulletRow}>
                    <View style={styles.skillBulletDot} />
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Achievements / Interests */}
            {achievements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Erfolge & Hobbys</Text>
                {achievements.map((ach, idx) => (
                  <View key={idx} style={styles.skillBulletRow}>
                    <View style={styles.skillBulletDot} />
                    <Text style={styles.skillText}>
                      {ach.title} {ach.description ? `- ${ach.description}` : ""}
                    </Text>
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
