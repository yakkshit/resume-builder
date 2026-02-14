import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"

// Use only built-in fonts to avoid issues
// These fonts are guaranteed to work with react-pdf
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    borderBottomStyle: "solid",
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#333",
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
    color: "#555",
  },
  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5,
    fontSize: 9,
    color: "#555",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#333",
  },
  sectionContent: {
    marginLeft: 0,
  },
  experienceItem: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#333",
    borderLeftStyle: "solid",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  itemSubtitle: {
    fontSize: 10,
    color: "#555",
  },
  itemDate: {
    fontSize: 9,
    color: "#777",
  },
  itemDescription: {
    fontSize: 9,
    marginTop: 3,
    lineHeight: 1.4,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  skillBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: "3 8",
    marginRight: 6,
    marginBottom: 6,
    fontSize: 9,
    color: "#333",
  },
  projectTech: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 3,
    marginBottom: 3,
  },
  techBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: "2 6",
    marginRight: 5,
    marginBottom: 3,
    fontSize: 8,
    color: "#333",
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  portfolioLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  portfolioLink: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5,
    fontSize: 9,
    color: "#555",
  },
})

interface ModernPDFTemplateProps {
  resumeData: ResumeData
}

export const ModernPDFTemplate = ({ resumeData }: ModernPDFTemplateProps) => {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Profile Picture - Now properly implemented */}
          {basicInfo.profilePicture ? (
            <Image src={basicInfo.profilePicture} style={styles.profileImage} cache={false} />
          ) : null}

          <View style={styles.headerContent}>
            <Text style={styles.name}>{basicInfo.name}</Text>
            <Text style={styles.title}>{basicInfo.title}</Text>
            <View style={styles.contactInfo}>
              {basicInfo.email ? (
                <View style={styles.contactItem}>
                  <Text>Email:{" "}
                    <Link
                    src={`mailto:${basicInfo.email}`}
                    style={{ textDecoration: "none", color: "#555" }}
                    >
                      {basicInfo.email}
                    </Link>
                    </Text>
                </View>
              ) : null}
              {basicInfo.phone ? (
                <View style={styles.contactItem}>
                  <Text>Phone:{" "}
                  <Link
                    src={`tel:${basicInfo.phone}`}
                    style={{ textDecoration: "none", color: "#555" }}
                    >
                    {basicInfo.phone}
                    </Link>
                  </Text>
                </View>
              ) : null}
              {basicInfo.location ? (
                <View style={styles.contactItem}>
                  <Text>Location: {basicInfo.location}</Text>
                </View>
              ) : null}
              {basicInfo.linkedin ? (
                <View style={styles.contactItem}>
                  <Link
                    src={`https://linkedin.com/in/${basicInfo.linkedin}`}
                    style={{ textDecoration: "none", color: "#555" }}
                    >
                  <Text>LinkedIn: {basicInfo.linkedin}</Text>
                  </Link>
                </View>
              ) : null}
              {basicInfo.website ? (
                <View style={styles.contactItem}>
                    <Link
                    src={basicInfo.website.startsWith("https://") ? basicInfo.website : `https://${basicInfo.website}`}
                    style={{ textDecoration: "none", color: "#555" }}
                    >
                  <Text>Website: {basicInfo.website}</Text>
                  </Link>
                </View>
              ) : null}
            </View>

            {/* Portfolio Links */}
            {basicInfo.portfolioLinks && basicInfo.portfolioLinks.length > 0 ? (
              <View style={styles.portfolioLinks}>
                {basicInfo.portfolioLinks.map((link, index) => (
                  <View key={`portfolio-${index}`} style={styles.portfolioLink}>
                    <Link
                    src={link.url?.startsWith("https://") || link.url?.startsWith("http://") ? link.url : `https://${link.url || link.platform}`}
                    style={{ textDecoration: "none", color: "#555" }}
                    >
                    <Text>
                      {link.platform}: {link.username || link.url}
                    </Text>
                    </Link>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Summary */}
        {basicInfo.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{basicInfo.summary}</Text>
          </View>
        ) : null}

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <View style={styles.sectionContent}>
            {experience.map((exp, index) => (
              <View key={`exp-${index}`} style={styles.experienceItem}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemTitle}>{exp.position}</Text>
                    <Text style={styles.itemSubtitle}>{exp.company}</Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {exp.startDate} - {exp.endDate}
                  </Text>
                </View>
                <Text style={styles.itemDescription}>{exp.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Projects */}
        {projects && projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            <View style={styles.sectionContent}>
              {projects.map((project, index) => (
                <View key={`proj-${index}`} style={styles.experienceItem}>
                  <View style={styles.itemHeader}>
                    <View>
                      <Text style={styles.itemTitle}>{project.name}</Text>
                      <View style={styles.projectTech}>
                        {(project.technologies || []).map((tech, techIndex) => (
                          <Text key={`tech-${techIndex}`} style={styles.techBadge}>
                            {typeof tech === "string" ? tech : String(tech)}
                          </Text>
                        ))}
                      </View>
                    </View>
                    {(project.startDate || project.endDate) ? (
                      <Text style={styles.itemDate}>
                        {project.startDate} - {project.endDate || "Present"}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.itemDescription}>{project.description}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          <View style={styles.sectionContent}>
            {education.map((edu, index) => (
              <View key={`edu-${index}`} style={styles.experienceItem}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemTitle}>{edu.institution}</Text>
                    <Text style={styles.itemSubtitle}>
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </Text>
                  </View>
                  <Text style={styles.itemDate}>
                    {edu.startDate} - {edu.endDate}
                  </Text>
                </View>
                {edu.gpa ? <Text style={styles.itemDescription}>GPA: {edu.gpa}</Text> : null}
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        {achievements && achievements.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.sectionContent}>
              {achievements.map((achievement, index) => (
                <View key={`ach-${index}`} style={styles.experienceItem}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{achievement.title}</Text>
                    {achievement.date ? <Text style={styles.itemDate}>{achievement.date}</Text> : null}
                  </View>
                  <Text style={styles.itemDescription}>{achievement.description}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Languages */}
        {basicInfo.languages && basicInfo.languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.skillsContainer}>
              {basicInfo.languages.map((language, index) => (
                <Text key={`lang-${index}`} style={styles.skillBadge}>
                  {language}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {skills.map((skill, index) => (
              <Text key={`skill-${index}`} style={styles.skillBadge}>
                {skill}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  )
}
