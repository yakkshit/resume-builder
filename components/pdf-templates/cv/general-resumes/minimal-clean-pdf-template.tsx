import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "@/components/logos/logos"

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#1e293b",
    lineHeight: 1.4,
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
    borderBottomStyle: "solid",
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 15,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  title: {
    fontSize: 11,
    color: "#2563eb",
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: 8.5,
    color: "#475569",
  },
  icon: {
    width: 9,
    height: 9,
    marginRight: 4,
  },
  photo: {
    width: 65,
    height: 65,
    borderRadius: 33,
    objectFit: "cover",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
    paddingBottom: 3,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.5,
  },
  itemGroup: {
    marginBottom: 9,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  itemSubtitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Oblique",
    color: "#475569",
  },
  itemDates: {
    fontSize: 8.5,
    color: "#64748b",
  },
  bulletList: {
    marginTop: 3,
    paddingLeft: 8,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 8,
    fontSize: 9,
    color: "#2563eb",
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: "#334155",
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 4,
  },
  badge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 8,
    color: "#334155",
    fontFamily: "Helvetica-Bold",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
  },
})

interface Props {
  resumeData: ResumeData
}

export function MinimalCleanPDFTemplate({ resumeData }: Props) {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{basicInfo.name || "Your Name"}</Text>
            {basicInfo.title ? <Text style={styles.title}>{basicInfo.title}</Text> : null}
            <View style={styles.contactRow}>
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
              {basicInfo.website && (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.website} style={styles.icon} />
                  <Link src={basicInfo.website} style={styles.link}>
                    {basicInfo.website.replace(/^https?:\/\/(www\.)?/, "")}
                  </Link>
                </View>
              )}
            </View>
          </View>
          {basicInfo.profilePicture && (
            <Image src={basicInfo.profilePicture} style={styles.photo} />
          )}
        </View>

        {/* Summary */}
        {basicInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{basicInfo.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {experience.map((exp, idx) => (
              <View key={idx} style={styles.itemGroup}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>
                    {exp.position} <Text style={styles.itemSubtitle}>— {exp.company}</Text>
                  </Text>
                  <Text style={styles.itemDates}>
                    {exp.startDate} {exp.endDate ? `- ${exp.endDate}` : ""}
                  </Text>
                </View>
                {exp.description && <Text style={styles.summaryText}>{exp.description}</Text>}
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
            ))}
          </View>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills & Competencies</Text>
            <View style={styles.badgeContainer}>
              {skills.map((skill, sIdx) => (
                <Text key={sIdx} style={styles.badge}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((proj, pIdx) => (
              <View key={pIdx} style={styles.itemGroup}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{proj.name}</Text>
                  {proj.startDate && (
                    <Text style={styles.itemDates}>
                      {proj.startDate} {proj.endDate ? `- ${proj.endDate}` : ""}
                    </Text>
                  )}
                </View>
                {proj.description && <Text style={styles.summaryText}>{proj.description}</Text>}
                {proj.technologies && proj.technologies.length > 0 && (
                  <Text style={[styles.itemDates, { marginTop: 2 }]}>
                    Tech: {proj.technologies.join(", ")}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, eIdx) => (
              <View key={eIdx} style={styles.itemGroup}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>
                    {edu.degree} {edu.field ? `in ${edu.field}` : ""} — {edu.institution}
                  </Text>
                  <Text style={styles.itemDates}>
                    {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ""}
                  </Text>
                </View>
                {edu.gpa && <Text style={styles.itemDates}>GPA: {edu.gpa}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {achievements.map((ach, aIdx) => (
              <View key={aIdx} style={styles.itemGroup}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{ach.title}</Text>
                  {ach.date && <Text style={styles.itemDates}>{ach.date}</Text>}
                </View>
                {ach.description && <Text style={styles.summaryText}>{ach.description}</Text>}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
