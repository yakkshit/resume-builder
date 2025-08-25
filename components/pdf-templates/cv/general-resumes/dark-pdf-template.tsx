import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { iconUrls, lightIconUrls } from "../../../logos/logos"

// Use only built-in fonts to avoid issues
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#ffffff",
    backgroundColor: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#6a5acd",
    borderBottomStyle: "solid",
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#a5b4fc",
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
    color: "#d1d5db",
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
    color: "#d1d5db",
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
    color: "#a5b4fc",
  },
  sectionContent: {
    marginLeft: 0,
  },
  experienceItem: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#6a5acd",
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
    color: "#ffffff",
  },
  itemSubtitle: {
    fontSize: 10,
    color: "#d1d5db",
  },
  itemDate: {
    fontSize: 9,
    color: "#9ca3af",
  },
  itemDescription: {
    fontSize: 9,
    marginTop: 3,
    lineHeight: 1.4,
    color: "#d1d5db",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  skillBadge: {
    backgroundColor: "#2d2d42",
    borderRadius: 10,
    padding: "3 8",
    marginRight: 6,
    marginBottom: 6,
    fontSize: 9,
    color: "#a5b4fc",
  },
  projectTech: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 3,
    marginBottom: 3,
  },
  techBadge: {
    backgroundColor: "#2d2d42",
    borderRadius: 8,
    padding: "2 6",
    marginRight: 5,
    marginBottom: 3,
    fontSize: 8,
    color: "#a5b4fc",
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#d1d5db",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#6a5acd",
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
    color: "#d1d5db",
  },
  link: {
    color: "#a5b4fc",
    textDecoration: "none",
  },
})

interface DarkPDFTemplateProps {
  resumeData: ResumeData
}

export const DarkPDFTemplate = ({ resumeData }: DarkPDFTemplateProps) => {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  // Use direct image URLs for icons
  const emailIcon = iconUrls.email
  const phoneIcon = lightIconUrls.phone
  const locationIcon = lightIconUrls.location
  const linkedinIcon = lightIconUrls.linkedin
  const websiteIcon = iconUrls.website
  const githubIcon = iconUrls.github

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Profile Picture - Now properly implemented */}
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
