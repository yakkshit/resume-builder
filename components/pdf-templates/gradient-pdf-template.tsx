import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "../logos/logos"

// Create a gradient-like effect with multiple color blocks
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientBlock1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "#1e3a8a", // deep blue
  },
  gradientBlock2: {
    position: "absolute",
    top: 250,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#312e81", // indigo
  },
  gradientBlock3: {
    position: "absolute",
    top: 400,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "#4c1d95", // purple
  },
  gradientBlock4: {
    position: "absolute",
    top: 550,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#581c87", // deep purple
  },
  contentWrapper: {
    position: "relative",
    padding: 30,
    height: "100%",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "white",
    borderBottomStyle: "solid",
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "white",
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
    color: "#e0e7ff",
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
    color: "white",
  },
  contactIcon: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "white",
  },
  sectionContent: {
    marginLeft: 0,
  },
  experienceItem: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "white",
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
    color: "white",
  },
  itemSubtitle: {
    fontSize: 10,
    color: "#e0e7ff",
  },
  itemDate: {
    fontSize: 9,
    color: "#c7d2fe",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 3,
    borderRadius: 3,
  },
  itemDescription: {
    fontSize: 9,
    marginTop: 3,
    lineHeight: 1.4,
    color: "white",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  skillBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    padding: "3 8",
    marginRight: 6,
    marginBottom: 6,
    fontSize: 9,
    color: "white",
  },
  projectTech: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 3,
    marginBottom: 3,
  },
  techBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    padding: "2 6",
    marginRight: 5,
    marginBottom: 3,
    fontSize: 8,
    color: "white",
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "white",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    borderRadius: 5,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "white",
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
    color: "white",
  },
  link: {
    color: "#c7d2fe",
    textDecoration: "none",
  },
  twoColumnContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  column: {
    flex: 1,
    paddingHorizontal: 5,
  },
})

interface GradientPDFTemplateProps {
  resumeData: ResumeData
}

export const GradientPDFTemplate = ({ resumeData }: GradientPDFTemplateProps) => {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  // Use direct image URLs for icons
  const emailIcon = lightIconUrls.email
  const phoneIcon = lightIconUrls.phone
  const locationIcon = lightIconUrls.location
  const linkedinIcon = lightIconUrls.linkedin
  const websiteIcon = lightIconUrls.website
  const githubIcon = lightIconUrls.github

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Gradient Background */}
        <View style={styles.gradientBackground}>
          <View style={styles.gradientBlock1} />
          <View style={styles.gradientBlock2} />
          <View style={styles.gradientBlock3} />
          <View style={styles.gradientBlock4} />
        </View>

        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.header}>
            {/* Profile Picture */}
            {basicInfo.profilePicture && (
              <Image src={basicInfo.profilePicture || "/placeholder.svg"} style={styles.profileImage} cache={false} />
            )}

            <View style={styles.headerContent}>
              <Text style={styles.name}>{basicInfo.name}</Text>
              <Text style={styles.title}>{basicInfo.title}</Text>
              <View style={styles.contactInfo}>
                {basicInfo.email && (
                  <View style={styles.contactItem}>
                    <Image src={emailIcon || "/placeholder.svg"} style={styles.contactIcon} />
                    <Link src={`mailto:${basicInfo.email}`} style={styles.link}>
                      <Text>{basicInfo.email}</Text>
                    </Link>
                  </View>
                )}
                {basicInfo.phone && (
                  <View style={styles.contactItem}>
                    <Image src={phoneIcon || "/placeholder.svg"} style={styles.contactIcon} />
                    <Link src={`tel:${basicInfo.phone.replace(/[^\d+]/g, "")}`} style={styles.link}>
                      <Text>{basicInfo.phone}</Text>
                    </Link>
                  </View>
                )}
                {basicInfo.location && (
                  <View style={styles.contactItem}>
                    <Image src={locationIcon || "/placeholder.svg"} style={styles.contactIcon} />
                    <Text>{basicInfo.location}</Text>
                  </View>
                )}
                {basicInfo.linkedin && (
                  <View style={styles.contactItem}>
                    <Image src={linkedinIcon || "/placeholder.svg"} style={styles.contactIcon} />
                    <Link src={`https://linkedin.com/in/${basicInfo.linkedin}`} style={styles.link}>
                      <Text>{basicInfo.linkedin}</Text>
                    </Link>
                  </View>
                )}
                {basicInfo.website && (
                  <View style={styles.contactItem}>
                    <Image src={websiteIcon || "/placeholder.svg"} style={styles.contactIcon} />
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
                      <Image src={link.platform === "GitHub" ? githubIcon : websiteIcon} style={styles.contactIcon} />
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
                  {experience.slice(0, Math.ceil(experience.length / 2)).map((exp, index) => (
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
              {/* Rest of Experience */}
              {experience.length > 1 && (
                <View style={styles.section}>
                  <View style={styles.sectionContent}>
                    {experience.slice(Math.ceil(experience.length / 2)).map((exp, index) => (
                      <View key={`exp-right-${index}`} style={styles.experienceItem}>
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
              )}

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
                            <View style={styles.projectTech}>
                              {project.technologies.map((tech, techIndex) => (
                                <Text key={`tech-${techIndex}`} style={styles.techBadge}>
                                  {tech}
                                </Text>
                              ))}
                            </View>
                          </View>
                          {(project.startDate || project.endDate) && (
                            <Text style={styles.itemDate}>
                              {project.startDate} - {project.endDate || "Present"}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.itemDescription}>{project.description}</Text>
                        {project.link && (
                          <Link src={project.link} style={[styles.link, { fontSize: 9, marginTop: 3 }]}>
                            <Text>View Project →</Text>
                          </Link>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Skills and Languages */}
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
                      <Text key={`lang-${index}`} style={styles.skillBadge}>
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