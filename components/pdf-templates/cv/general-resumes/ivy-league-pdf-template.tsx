import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"

// Ivy League / Academic Engineering ATS Resume (Sparky Sundevil style)
const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 34,
    paddingRight: 34,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#000000",
    backgroundColor: "#ffffff",
    lineHeight: 1.3,
  },
  // Centered Header
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
    textAlign: "center",
  },
  targetTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#333333",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
    textAlign: "center",
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 6,
  },
  contactText: {
    fontSize: 8,
    color: "#000000",
  },
  contactBullet: {
    fontSize: 8,
    color: "#000000",
    marginHorizontal: 4,
  },
  headerDivider: {
    borderBottomWidth: 1.2,
    borderBottomColor: "#000000",
    marginBottom: 8,
  },
  // Section Headers
  section: {
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 0.8,
    borderBottomColor: "#000000",
    paddingBottom: 1.5,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 8.2,
    color: "#000000",
    lineHeight: 1.35,
    textAlign: "justify",
  },
  // Entries
  entryContainer: {
    marginBottom: 6,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  entryTitleLeft: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    flex: 1,
    marginRight: 8,
  },
  entryDateRight: {
    fontSize: 8.2,
    color: "#000000",
    flexShrink: 0,
    textAlign: "right",
  },
  entrySubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  entrySubtitleLeft: {
    fontSize: 8.2,
    color: "#000000",
    flex: 1,
  },
  entryGpaRight: {
    fontSize: 8.2,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    flexShrink: 0,
    textAlign: "right",
  },
  entryDescription: {
    fontSize: 8.2,
    color: "#000000",
    lineHeight: 1.35,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
    paddingLeft: 6,
  },
  bulletDot: {
    fontSize: 8,
    color: "#000000",
    marginRight: 4,
    marginTop: -0.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 8.2,
    color: "#000000",
    lineHeight: 1.32,
  },
  // Technical Skills Category Layout
  skillCategoryRow: {
    flexDirection: "row",
    marginBottom: 2.5,
    paddingLeft: 1,
  },
  skillCategoryLabel: {
    fontSize: 8.2,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginRight: 4,
  },
  skillCategoryValues: {
    fontSize: 8.2,
    color: "#000000",
    flex: 1,
    lineHeight: 1.3,
  },
})

export function IvyLeaguePDFTemplate({ resumeData }: { resumeData: ResumeData }) {
  const { basicInfo, experience = [], education = [], skills = [], projects = [], achievements = [] } = resumeData

  // Clean contact items for header
  const contactParts: string[] = []
  if (basicInfo.phone) contactParts.push(basicInfo.phone)
  if (basicInfo.email) contactParts.push(basicInfo.email)
  if (basicInfo.linkedin) contactParts.push(basicInfo.linkedin.replace(/^https?:\/\/(www\.)?/, ""))
  if (basicInfo.website) contactParts.push(basicInfo.website.replace(/^https?:\/\/(www\.)?/, ""))
  if (basicInfo.portfolioLinks && basicInfo.portfolioLinks.length > 0) {
    basicInfo.portfolioLinks.forEach((link) => {
      if (link.url) contactParts.push(link.url.replace(/^https?:\/\/(www\.)?/, ""))
    })
  } else if (basicInfo.location) {
    contactParts.push(basicInfo.location)
  }

  // Partition experience into professional and other if many
  const professionalExp = experience.slice(0, 3)
  const otherExp = experience.slice(3)

  // Partition skills cleanly into categorized rows
  const categorizeSkills = (skillsList: string[]) => {
    if (skillsList.length <= 6) {
      return [{ label: "Technical Skills:", values: skillsList.join(", ") }]
    }

    const mid = Math.ceil(skillsList.length / 3)
    return [
      { label: "Programming & Frameworks:", values: skillsList.slice(0, mid).join(", ") },
      { label: "Tools & Technologies:", values: skillsList.slice(mid, mid * 2).join(", ") },
      { label: "Data & Systems:", values: skillsList.slice(mid * 2).join(", ") },
    ]
  }

  const categorizedSkills = categorizeSkills(skills)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Centered Name & Contact Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{basicInfo.name || "SPARKY SUNDEVIL"}</Text>
          {basicInfo.title ? <Text style={styles.targetTitle}>{basicInfo.title}</Text> : null}

          <View style={styles.contactRow}>
            {contactParts.map((item, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center" }}>
                {idx > 0 && <Text style={styles.contactBullet}>•</Text>}
                <Text style={styles.contactText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.headerDivider} />

        {/* SUMMARY */}
        {basicInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{basicInfo.summary}</Text>
          </View>
        )}

        {/* EDUCATION */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitleLeft}>
                    {edu.degree} {edu.field ? `, ${edu.field}` : ""}
                  </Text>
                  <Text style={styles.entryDateRight}>
                    {edu.endDate ? `Graduating ${edu.endDate}` : edu.startDate || ""}
                  </Text>
                </View>
                <View style={styles.entrySubRow}>
                  <Text style={styles.entrySubtitleLeft}>{edu.institution}</Text>
                  {edu.gpa ? <Text style={styles.entryGpaRight}>{edu.gpa} GPA</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TECHNICAL SKILLS */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            {categorizedSkills.map((cat, idx) => (
              <View key={idx} style={styles.skillCategoryRow}>
                <Text style={styles.skillCategoryLabel}>{cat.label}</Text>
                <Text style={styles.skillCategoryValues}>{cat.values}</Text>
              </View>
            ))}
            {basicInfo.languages && basicInfo.languages.length > 0 && (
              <View style={styles.skillCategoryRow}>
                <Text style={styles.skillCategoryLabel}>Languages:</Text>
                <Text style={styles.skillCategoryValues}>{basicInfo.languages.join(", ")}</Text>
              </View>
            )}
          </View>
        )}

        {/* PROFESSIONAL EXPERIENCE */}
        {professionalExp.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {professionalExp.map((exp, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitleLeft}>
                    {exp.company}
                    {exp.company && exp.position ? ": " : ""}
                    {exp.position}
                  </Text>
                  <Text style={styles.entryDateRight}>
                    {exp.startDate || exp.endDate ? `${exp.startDate || ""} – ${exp.endDate || "Present"}` : ""}
                  </Text>
                </View>
                {exp.description ? <Text style={styles.entryDescription}>{exp.description}</Text> : null}
                {exp.highlights?.map((h, hIdx) => (
                  <View key={hIdx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{h}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ACADEMIC PROJECTS */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic Projects</Text>
            {projects.map((proj, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitleLeft}>{proj.name}</Text>
                  <Text style={styles.entryDateRight}>
                    {proj.startDate || proj.endDate ? `${proj.startDate || ""} – ${proj.endDate || ""}` : ""}
                  </Text>
                </View>
                {proj.description ? <Text style={styles.entryDescription}>{proj.description}</Text> : null}
                {proj.technologies && proj.technologies.length > 0 && (
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>Technologies: {proj.technologies.join(", ")}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* OTHER WORK EXPERIENCE */}
        {otherExp.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Work Experience</Text>
            {otherExp.map((exp, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitleLeft}>
                    {exp.company}: {exp.position}
                  </Text>
                  <Text style={styles.entryDateRight}>
                    {exp.startDate || exp.endDate ? `${exp.startDate || ""} – ${exp.endDate || ""}` : ""}
                  </Text>
                </View>
                {exp.description ? <Text style={styles.entryDescription}>{exp.description}</Text> : null}
                {exp.highlights?.map((h, hIdx) => (
                  <View key={hIdx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{h}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ACTIVITIES / ACHIEVEMENTS */}
        {achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activities & Leadership</Text>
            {achievements.map((ach, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitleLeft}>{ach.title}</Text>
                  <Text style={styles.entryDateRight}>{ach.date || ""}</Text>
                </View>
                {ach.description ? (
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{ach.description}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
