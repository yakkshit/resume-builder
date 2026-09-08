import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "@/components/logos/logos"

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#0f172a",
    backgroundColor: "#ffffff",
    lineHeight: 1.35,
  },
  header: {
    backgroundColor: "#0f172a",
    marginHorizontal: -30,
    marginTop: -30,
    padding: 25,
    marginBottom: 20,
    color: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.3,
    lineHeight: 1.2,
  },
  title: {
    fontSize: 10.5,
    color: "#38bdf8",
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
    marginBottom: 8,
    textTransform: "uppercase",
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
    color: "#cbd5e1",
    marginRight: 10,
    marginBottom: 4,
  },
  icon: {
    width: 9,
    height: 9,
    marginRight: 4,
  },
  photo: {
    width: 62,
    height: 62,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#38bdf8",
    objectFit: "cover",
  },
  columns: {
    flexDirection: "row",
  },
  mainColumn: {
    flex: 2,
    paddingRight: 15,
  },
  sideColumn: {
    flex: 1,
  },
  section: {
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1.5,
    borderBottomColor: "#38bdf8",
    paddingBottom: 3,
    marginBottom: 8,
  },
  itemGroup: {
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  itemCompany: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Oblique",
    color: "#0284c7",
  },
  itemDates: {
    fontSize: 8,
    color: "#64748b",
    flexShrink: 0,
    textAlign: "right",
  },
  text: {
    fontSize: 8.5,
    color: "#334155",
    marginTop: 2,
  },
  bulletList: {
    marginTop: 2,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletDot: {
    width: 8,
    fontSize: 8.5,
    color: "#0284c7",
  },
  bulletText: {
    flex: 1,
    fontSize: 8.5,
    color: "#334155",
  },
  techPillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  techPill: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  link: {
    color: "#38bdf8",
    textDecoration: "none",
  },
})

interface Props {
  resumeData: ResumeData
}

export function TechModernPDFTemplate({ resumeData }: Props) {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Dark Tech Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{basicInfo.name || "Your Name"}</Text>
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

        {/* 2-Column Body */}
        <View style={styles.columns}>
          {/* Main Column */}
          <View style={styles.mainColumn}>
            {basicInfo.summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile Overview</Text>
                <Text style={styles.text}>{basicInfo.summary}</Text>
              </View>
            )}

            {experience && experience.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
                {experience.map((exp, idx) => (
                  <View key={idx} style={styles.itemGroup}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{exp.position}</Text>
                      <Text style={styles.itemDates}>
                        {exp.startDate} {exp.endDate ? `- ${exp.endDate}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.itemCompany}>{exp.company}</Text>
                    {exp.description && <Text style={styles.text}>{exp.description}</Text>}
                    {exp.highlights && exp.highlights.length > 0 && (
                      <View style={styles.bulletList}>
                        {exp.highlights.map((hl, hIdx) => (
                          <View key={hIdx} style={styles.bulletItem}>
                            <Text style={styles.bulletDot}>›</Text>
                            <Text style={styles.bulletText}>{hl}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {projects && projects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured Projects</Text>
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
                    {proj.description && <Text style={styles.text}>{proj.description}</Text>}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <View style={styles.techPillContainer}>
                        {proj.technologies.map((tech, tIdx) => (
                          <Text key={tIdx} style={styles.techPill}>
                            {tech}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Side Column */}
          <View style={styles.sideColumn}>
            {skills && skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills & Stack</Text>
                <View style={styles.techPillContainer}>
                  {skills.map((skill, sIdx) => (
                    <Text key={sIdx} style={styles.techPill}>
                      {skill}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {education && education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {education.map((edu, eIdx) => (
                  <View key={eIdx} style={styles.itemGroup}>
                    <Text style={styles.itemTitle}>{edu.degree}</Text>
                    {edu.field && <Text style={styles.text}>{edu.field}</Text>}
                    <Text style={styles.itemCompany}>{edu.institution}</Text>
                    <Text style={styles.itemDates}>
                      {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ""}
                    </Text>
                    {edu.gpa && <Text style={styles.itemDates}>GPA: {edu.gpa}</Text>}
                  </View>
                ))}
              </View>
            )}

            {achievements && achievements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Honors & Awards</Text>
                {achievements.map((ach, aIdx) => (
                  <View key={aIdx} style={styles.itemGroup}>
                    <Text style={styles.itemTitle}>{ach.title}</Text>
                    {ach.date && <Text style={styles.itemDates}>{ach.date}</Text>}
                    {ach.description && <Text style={styles.text}>{ach.description}</Text>}
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
