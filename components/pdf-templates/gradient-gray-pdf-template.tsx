import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "../logos/logos"

// Create a more professional gradient template with improved styling
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#ffffff",
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "#1e293b", // Dark blue-gray
  },
  mainBackground: {
    position: "absolute",
    top: 180,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#334155", // Medium blue-gray
  },
  contentWrapper: {
    position: "relative",
    padding: 40,
    height: "100%",
  },
  header: {
    flexDirection: "row",
    marginBottom: 30,
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#64748b", // Border color
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    marginBottom: 12,
    color: "#94a3b8", // Light blue-gray
    fontFamily: "Helvetica-Oblique",
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
    color: "#e2e8f0", // Very light gray
  },
  contactIcon: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#64748b", // Border color
    borderBottomStyle: "solid",
    marginTop: 5,
    marginBottom: 25,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#64748b", // Border color
    borderBottomStyle: "solid",
  },
  sectionContent: {
    marginLeft: 0,
  },
  experienceItem: {
    marginBottom: 15,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#94a3b8", // Light blue-gray
    borderLeftStyle: "solid",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  itemSubtitle: {
    fontSize: 10,
    color: "#e2e8f0", // Very light gray
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 9,
    color: "#94a3b8", // Light blue-gray
    backgroundColor: "rgba(148, 163, 184, 0.1)", // Semi-transparent light blue-gray
    padding: "3 6",
    borderRadius: 3,
  },
  itemDescription: {
    fontSize: 9,
    marginTop: 4,
    lineHeight: 1.5,
    color: "#e2e8f0", // Very light gray
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
    gap: 6,
  },
  skillBadge: {
    backgroundColor: "rgba(148, 163, 184, 0.2)", // Semi-transparent light blue-gray
    borderRadius: 4,
    padding: "4 8",
    fontSize: 9,
    color: "#ffffff",
  },
  projectTech: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
    marginBottom: 5,
    gap: 4,
  },
  techBadge: {
    backgroundColor: "rgba(148, 163, 184, 0.2)", // Semi-transparent light blue-gray
    borderRadius: 4,
    padding: "3 6",
    fontSize: 8,
    color: "#ffffff",
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#e2e8f0", // Very light gray
    backgroundColor: "rgba(148, 163, 184, 0.1)", // Semi-transparent light blue-gray
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
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
    color: "#e2e8f0", // Very light gray
  },
  link: {
    color: "#94a3b8", // Light blue-gray
    textDecoration: "none",
  },
  twoColumnContainer: {
    flexDirection: "row",
    marginTop: 15,
    gap: 20,
  },
  column: {
    flex: 1,
  },
  viewProjectLink: {
    color: "#94a3b8", // Light blue-gray
    fontSize: 9,
    marginTop: 3,
    textDecoration: "none",
  },
  languageItem: {
    backgroundColor: "rgba(148, 163, 184, 0.2)", // Semi-transparent light blue-gray
    borderRadius: 4,
    padding: "4 8",
    fontSize: 9,
    color: "#ffffff",
    marginRight: 6,
    marginBottom: 6,
  },
})

interface GradientGrayPDFTemplateProps {
  resumeData: ResumeData
}

export const GradientGrayPDFTemplate = ({ resumeData }: GradientGrayPDFTemplateProps) => {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Gradient Background */}
        <View style={styles.gradientBackground}>
          <View style={styles.headerBackground} />
          <View style={styles.mainBackground} />
        </View>

        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            {/* Profile Picture */}
            {basicInfo.profilePicture && (
              <View style={styles.profileImageContainer}>
                <Image src={basicInfo.profilePicture || "/placeholder.svg"} style={styles.profileImage} cache={false} />
              </View>
            )}

            <View style={styles.headerContent}>
              <Text style={styles.name}>{basicInfo.name}</Text>
              <Text style={styles.title}>{basicInfo.title}</Text>
              <View style={styles.contactInfo}>
                {basicInfo.email && (
                  <View style={styles.contactItem}>
                    <Image src={lightIconUrls.email || "/placeholder.svg"} style={styles.contactIcon} />
                    <Link src={`mailto:${basicInfo.email}`} style={styles.link}>
                      <Text>{basicInfo.email}</Text>
                    </Link>
                  </View>
                )}
                {basicInfo.phone && (
                  <View style={styles.contactItem}>
                    <Image src={lightIconUrls.phone || "/placeholder.svg"} style={styles.contactIcon} />
                    <Link src={`tel:${basicInfo.phone.replace(/[^\d+]/g, "")}`} style={styles.link}>
                      <Text>{basicInfo.phone}</Text>
                    </Link>
                  </View>
                )}
                {basicInfo.location && (
                  <View style={styles.contactItem}>
                    <Image src={lightIconUrls.location || "/placeholder.svg"} style={styles.contactIcon} />
                    <Text>{basicInfo.location}</Text>
                  </View>
                )}
                {basicInfo.linkedin && (
                  <View style={styles.contactItem}>
                    <Image src={lightIconUrls.linkedin || "/placeholder.svg"} style={styles.contactIcon} />
                    <Link src={`https://linkedin.com/in/${basicInfo.linkedin}`} style={styles.link}>
                      <Text>{basicInfo.linkedin}</Text>
                    </Link>
                  </View>
                )}
                {basicInfo.website && (
                  <View style={styles.contactItem}>
                    <Image src={lightIconUrls.website || "/placeholder.svg"} style={styles.contactIcon} />
                    <Link
                      src={basicInfo.website.startsWith("http") ? basicInfo.website : `https://${basicInfo.website}`}
                      style={styles.link}
                    >
                      <Text>{basicInfo.website}</Text>
                    </Link>
                  </View>
                )}
              </View>

              {/* Portfolio Links */}
              {basicInfo.portfolioLinks && basicInfo.portfolioLinks.length > 0 && (
                <View style={styles.portfolioLinks}>
                  {basicInfo.portfolioLinks.map((link, index) => (
                    <View key={`portfolio-${index}`} style={styles.portfolioLink}>
                      <Image
                        src={link.platform === "GitHub" ? lightIconUrls.github : lightIconUrls.externalLink}
                        style={styles.contactIcon}
                      />
                      <Link src={link.url} style={styles.link}>
                        <Text>
                          {link.platform}: {link.username || link.url}
                        </Text>
                      </Link>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* <View style={styles.divider} /> */}

          {/* Summary */}
          {basicInfo.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <Text style={styles.summary}>{basicInfo.summary}</Text>
            </View>
          )}

          {/* Two Column Layout for the rest */}
          <View style={styles.twoColumnContainer}>
            {/* Left Column */}
            <View style={styles.column}>
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
                      {edu.gpa && <Text style={styles.itemDescription}>GPA: {edu.gpa}</Text>}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.column}>
              {/* Projects */}
              {projects && projects.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Projects</Text>
                  <View style={styles.sectionContent}>
                    {projects.map((project, index) => (
                      <View key={`proj-${index}`} style={styles.experienceItem}>
                        <View style={styles.itemHeader}>
                          <View>
                            <Text style={styles.itemTitle}>{project.name}</Text>
                          </View>
                          {(project.startDate || project.endDate) && (
                            <Text style={styles.itemDate}>
                              {project.startDate} - {project.endDate || "Present"}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.itemDescription}>{project.description}</Text>
                        <View style={styles.projectTech}>
                          {project.technologies.map((tech, techIndex) => (
                            <Text key={`tech-${techIndex}`} style={styles.techBadge}>
                              {tech}
                            </Text>
                          ))}
                        </View>
                        {project.link && (
                          <Link src={project.link} style={styles.viewProjectLink}>
                            <Text>View Project →</Text>
                          </Link>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

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

              {/* Languages */}
              {basicInfo.languages && basicInfo.languages.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Languages</Text>
                  <View style={styles.skillsContainer}>
                    {basicInfo.languages.map((language, index) => (
                      <Text key={`lang-${index}`} style={styles.languageItem}>
                        {language}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Achievements */}
              {achievements && achievements.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Achievements</Text>
                  <View style={styles.sectionContent}>
                    {achievements.map((achievement, index) => (
                      <View key={`ach-${index}`} style={styles.experienceItem}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemTitle}>{achievement.title}</Text>
                          {achievement.date && <Text style={styles.itemDate}>{achievement.date}</Text>}
                        </View>
                        <Text style={styles.itemDescription}>{achievement.description}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}