import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { coloredIconUrls } from "../logos/logos"

// Use only built-in fonts to avoid issues
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  container: {
    flexDirection: "row",
    height: "100%",
  },
  leftColumn: {
    width: "30%",
    backgroundColor: "#1f2937", // dark gray
    color: "white",
    padding: 20,
  },
  rightColumn: {
    width: "70%",
    padding: 20,
    backgroundColor: "white",
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#10b981", // teal
  },
  name: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "white",
    textAlign: "center",
  },
  title: {
    fontSize: 12,
    color: "#10b981", // teal
    marginBottom: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#10b981", // teal
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#374151", // darker gray
    paddingBottom: 3,
  },
  rightSectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#1f2937", // dark gray
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb", // light gray
    paddingBottom: 3,
  },
  contactItem: {
    marginBottom: 5,
    fontSize: 9,
  },
  contactIcon: {
    width: 10,
    height: 10,
    marginRight: 5,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  skillsContainer: {
    marginTop: 5,
    marginBottom: 15,
  },
  skillItem: {
    marginBottom: 5,
    fontSize: 9,
  },
  languageItem: {
    marginBottom: 5,
    fontSize: 9,
  },
  portfolioItem: {
    marginBottom: 5,
    fontSize: 9,
  },
  experienceItem: {
    marginBottom: 15,
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
    color: "#4b5563", // gray
  },
  itemDate: {
    fontSize: 9,
    color: "#6b7280", // lighter gray
  },
  itemDescription: {
    fontSize: 9,
    marginTop: 3,
    lineHeight: 1.4,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 15,
  },
  projectTech: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 3,
    marginBottom: 3,
  },
  techBadge: {
    backgroundColor: "#f3f4f6", // very light gray
    borderRadius: 3,
    padding: "2 5",
    marginRight: 5,
    marginBottom: 3,
    fontSize: 8,
  },
  link: {
    color: "#10b981", // teal
    textDecoration: "none",
  },
  leftLink: {
    color: "#a5f3fc", // light cyan
    textDecoration: "none",
  },
})

interface TwoColumnPDFTemplateProps {
  resumeData: ResumeData
}

export const TwoColumnPDFTemplate = ({ resumeData }: TwoColumnPDFTemplateProps) => {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  // Use direct image URLs for icons
  const emailIcon = coloredIconUrls.teal.email
  const phoneIcon = coloredIconUrls.teal.phone
  const locationIcon = coloredIconUrls.teal.location
  const linkedinIcon = coloredIconUrls.teal.linkedin
  const websiteIcon = coloredIconUrls.teal.website
  const githubIcon = coloredIconUrls.teal.github

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Profile Section */}
            <View style={styles.profileContainer}>
              {basicInfo.profilePicture && (
                <Image src={basicInfo.profilePicture || "/placeholder.svg"} style={styles.profileImage} cache={false} />
              )}
              <Text style={styles.name}>{basicInfo.name}</Text>
              <Text style={styles.title}>{basicInfo.title}</Text>
            </View>

            {/* Contact Section */}
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionTitle}>Contact</Text>

              {basicInfo.email && (
                <View style={styles.contactRow}>
                  <Image src={emailIcon || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link src={`mailto:${basicInfo.email}`} style={styles.leftLink}>
                    <Text style={styles.contactItem}>{basicInfo.email}</Text>
                  </Link>
                </View>
              )}

              {basicInfo.phone && (
                <View style={styles.contactRow}>
                  <Image src={phoneIcon || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link src={`tel:${basicInfo.phone.replace(/[^\d+]/g, "")}`} style={styles.leftLink}>
                    <Text style={styles.contactItem}>{basicInfo.phone}</Text>
                  </Link>
                </View>
              )}

              {basicInfo.location && (
                <View style={styles.contactRow}>
                  <Image src={locationIcon || "/placeholder.svg"} style={styles.contactIcon} />
                  <Text style={styles.contactItem}>{basicInfo.location}</Text>
                </View>
              )}

              {basicInfo.linkedin && (
                <View style={styles.contactRow}>
                  <Image src={linkedinIcon || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link src={`https://linkedin.com/in/${basicInfo.linkedin}`} style={styles.leftLink}>
                    <Text style={styles.contactItem}>{basicInfo.linkedin}</Text>
                  </Link>
                </View>
              )}

              {basicInfo.website && (
                <View style={styles.contactRow}>
                  <Image src={websiteIcon || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link
                    src={basicInfo.website.startsWith("http") ? basicInfo.website : `https://${basicInfo.website}`}
                    style={styles.leftLink}
                  >
                    <Text style={styles.contactItem}>{basicInfo.website}</Text>
                  </Link>
                </View>
              )}
            </View>

            {/* Portfolio Links */}
            {basicInfo.portfolioLinks && basicInfo.portfolioLinks.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>Portfolio</Text>
                {basicInfo.portfolioLinks.map((link, index) => (
                  <View key={`portfolio-${index}`} style={styles.contactRow}>
                    <Image src={link.platform === "GitHub" ? githubIcon : websiteIcon} style={styles.contactIcon} />
                    <Link src={link.url} style={styles.leftLink}>
                      <Text style={styles.portfolioItem}>
                        {link.platform}: {link.username || link.url}
                      </Text>
                    </Link>
                  </View>
                ))}
              </View>
            )}

            {/* Skills Section */}
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.skillsContainer}>
                {skills.map((skill, index) => (
                  <Text key={`skill-${index}`} style={styles.skillItem}>
                    • {skill}
                  </Text>
                ))}
              </View>
            </View>

            {/* Languages Section */}
            {basicInfo.languages && basicInfo.languages.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>Languages</Text>
                <View style={styles.skillsContainer}>
                  {basicInfo.languages.map((language, index) => (
                    <Text key={`lang-${index}`} style={styles.languageItem}>
                      • {language}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Summary */}
            {basicInfo.summary && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.summary}>{basicInfo.summary}</Text>
              </View>
            )}

            {/* Experience */}
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.rightSectionTitle}>Experience</Text>
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

            {/* Education */}
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.rightSectionTitle}>Education</Text>
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

            {/* Projects */}
            {projects && projects.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.rightSectionTitle}>Projects</Text>
                {projects.map((project, index) => (
                  <View key={`proj-${index}`} style={styles.experienceItem}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{project.name}</Text>
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
                      <Link src={project.link} style={[styles.link, { fontSize: 9 }]}>
                        <Text>View Project →</Text>
                      </Link>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Achievements */}
            {achievements && achievements.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.rightSectionTitle}>Achievements</Text>
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
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}