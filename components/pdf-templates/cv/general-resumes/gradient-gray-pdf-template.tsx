import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "../../../logos/logos"

// Optimized two-column template with better space utilization
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#2d3748",
  },

  // Left Column (Sidebar) - Optimized
  leftColumn: {
    width: "32%",
    backgroundColor: "#1a202c",
    padding: "20 18",
    color: "#ffffff",
  },

  // Right Column (Main Content) - Optimized
  rightColumn: {
    width: "68%",
    padding: "20 22",
    backgroundColor: "#ffffff",
  },

  // Profile Section (Compact)
  profileSection: {
    alignItems: "center",
    marginBottom: 18,
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    border: "3px solid #3182ce",
    marginBottom: 10,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  profileName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  profileTitle: {
    fontSize: 10,
    color: "#90cdf4",
    textAlign: "center",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 12,
  },

  // Compact Contact Section
  contactSection: {
    marginBottom: 18,
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#90cdf4",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottom: "1px solid #3182ce",
    paddingBottom: 3,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  contactIcon: {
    width: 10,
    height: 10,
    marginRight: 8,
    tintColor: "#90cdf4",
  },
  contactText: {
    fontSize: 8,
    color: "#e2e8f0",
    flex: 1,
  },
  contactLink: {
    color: "#90cdf4",
    textDecoration: "none",
  },

  // Compact Skills Section
  skillsSection: {
    marginBottom: 18,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillItem: {
    backgroundColor: "rgba(49, 130, 206, 0.2)",
    padding: "3 8",
    borderRadius: 10,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 8,
    color: "#90cdf4",
    fontFamily: "Helvetica-Bold",
  },

  // Compact Languages Section
  languagesSection: {
    marginBottom: 18,
  },
  languageItem: {
    marginBottom: 5,
    padding: "4 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  languageName: {
    fontSize: 9,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
  },

  // Compact Portfolio Section
  portfolioSection: {
    marginBottom: 15,
  },
  portfolioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: "rgba(49, 130, 206, 0.1)",
    padding: "4 6",
    borderRadius: 3,
  },
  portfolioIcon: {
    width: 10,
    height: 10,
    marginRight: 6,
    tintColor: "#90cdf4",
  },
  portfolioText: {
    fontSize: 8,
    color: "#e2e8f0",
    flex: 1,
  },
  portfolioLink: {
    color: "#90cdf4",
    textDecoration: "none",
  },

  // Right Column Sections (Optimized)
  mainSectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#1a202c",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: "2px solid #3182ce",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Compact Summary Section
  summarySection: {
    marginBottom: 18,
  },
  summaryText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: "#4a5568",
    textAlign: "justify",
    backgroundColor: "#f7fafc",
    padding: 10,
    borderRadius: 4,
    borderLeft: "3px solid #3182ce",
  },

  // Compact Experience Section
  experienceSection: {
    marginBottom: 18,
  },
  experienceItem: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #e2e8f0",
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  experienceLeft: {
    flex: 1,
    marginRight: 8,
  },
  experienceTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a202c",
    marginBottom: 2,
  },
  experienceCompany: {
    fontSize: 9,
    color: "#3182ce",
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  experienceDate: {
    fontSize: 8,
    color: "#718096",
    backgroundColor: "#edf2f7",
    padding: "2 6",
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  experienceDescription: {
    fontSize: 9,
    lineHeight: 1.3,
    color: "#4a5568",
  },

  // Compact Education Section
  educationSection: {
    marginBottom: 18,
  },
  educationItem: {
    marginBottom: 10,
    backgroundColor: "#f7fafc",
    padding: 8,
    borderRadius: 4,
    borderLeft: "3px solid #3182ce",
  },
  educationDegree: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a202c",
    marginBottom: 2,
  },
  educationInstitution: {
    fontSize: 9,
    color: "#3182ce",
    marginBottom: 2,
  },
  educationDate: {
    fontSize: 8,
    color: "#718096",
    marginBottom: 3,
  },
  educationGPA: {
    fontSize: 8,
    color: "#4a5568",
  },

  // Compact Projects Section
  projectsSection: {
    marginBottom: 18,
  },
  projectItem: {
    marginBottom: 12,
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    border: "1px solid #e2e8f0",
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  projectTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a202c",
    flex: 1,
    marginRight: 8,
  },
  projectDate: {
    fontSize: 8,
    color: "#718096",
    backgroundColor: "#edf2f7",
    padding: "2 6",
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  projectDescription: {
    fontSize: 9,
    color: "#4a5568",
    lineHeight: 1.3,
    marginBottom: 6,
  },
  projectTech: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginBottom: 5,
  },
  techTag: {
    backgroundColor: "#3182ce",
    color: "#ffffff",
    padding: "2 6",
    borderRadius: 2,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
  projectLink: {
    fontSize: 8,
    color: "#3182ce",
    textDecoration: "none",
    fontFamily: "Helvetica-Bold",
  },

  // Compact Achievements Section
  achievementsSection: {
    marginBottom: 15,
  },
  achievementItem: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeft: "2px solid #3182ce",
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  achievementTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#1a202c",
    flex: 1,
    marginRight: 8,
  },
  achievementDate: {
    fontSize: 8,
    color: "#718096",
    alignSelf: "flex-start",
  },
  achievementDescription: {
    fontSize: 8,
    color: "#4a5568",
    lineHeight: 1.3,
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
        {/* Left Column - Compact Sidebar */}
        <View style={styles.leftColumn}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            {basicInfo.profilePicture && (
              <View style={styles.profileImageContainer}>
                <Image 
                  src={basicInfo.profilePicture || "/placeholder.svg"} 
                  style={styles.profileImage} 
                  cache={false} 
                />
              </View>
            )}
            <Text style={styles.profileName}>{basicInfo.name}</Text>
            <Text style={styles.profileTitle}>{basicInfo.title}</Text>
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <Text style={styles.sidebarSectionTitle}>Contact</Text>
            {basicInfo.email && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.email || "/placeholder.svg"} style={styles.contactIcon} />
                <Link src={`mailto:${basicInfo.email}`} style={styles.contactLink}>
                  <Text style={styles.contactText}>{basicInfo.email}</Text>
                </Link>
              </View>
            )}
            {basicInfo.phone && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.phone || "/placeholder.svg"} style={styles.contactIcon} />
                <Link src={`tel:${basicInfo.phone.replace(/[^\d+]/g, "")}`} style={styles.contactLink}>
                  <Text style={styles.contactText}>{basicInfo.phone}</Text>
                </Link>
              </View>
            )}
            {basicInfo.location && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.location || "/placeholder.svg"} style={styles.contactIcon} />
                <Text style={styles.contactText}>{basicInfo.location}</Text>
              </View>
            )}
            {basicInfo.linkedin && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.linkedin || "/placeholder.svg"} style={styles.contactIcon} />
                <Link src={`https://linkedin.com/in/${basicInfo.linkedin}`} style={styles.contactLink}>
                  <Text style={styles.contactText}>{basicInfo.linkedin}</Text>
                </Link>
              </View>
            )}
            {basicInfo.website && (
              <View style={styles.contactItem}>
                <Image src={lightIconUrls.website || "/placeholder.svg"} style={styles.contactIcon} />
                <Link
                  src={basicInfo.website.startsWith("http") ? basicInfo.website : `https://${basicInfo.website}`}
                  style={styles.contactLink}
                >
                  <Text style={styles.contactText}>{basicInfo.website}</Text>
                </Link>
              </View>
            )}
          </View>

          {/* Skills */}
          {skills && skills.length > 0 && (
            <View style={styles.skillsSection}>
              <Text style={styles.sidebarSectionTitle}>Skills</Text>
              <View style={styles.skillsGrid}>
                {skills.map((skill, index) => (
                  <View key={`skill-${index}`} style={styles.skillItem}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Languages */}
          {basicInfo.languages && basicInfo.languages.length > 0 && (
            <View style={styles.languagesSection}>
              <Text style={styles.sidebarSectionTitle}>Languages</Text>
              {basicInfo.languages.map((language, index) => (
                <View key={`lang-${index}`} style={styles.languageItem}>
                  <Text style={styles.languageName}>{language}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Portfolio Links */}
          {basicInfo.portfolioLinks && basicInfo.portfolioLinks.length > 0 && (
            <View style={styles.portfolioSection}>
              <Text style={styles.sidebarSectionTitle}>Portfolio</Text>
              {basicInfo.portfolioLinks.map((link, index) => (
                <View key={`portfolio-${index}`} style={styles.portfolioItem}>
                  <Image
                    src={link.platform === "GitHub" ? lightIconUrls.github : lightIconUrls.externalLink}
                    style={styles.portfolioIcon}
                  />
                  <Link src={link.url} style={styles.portfolioLink}>
                    <Text style={styles.portfolioText}>
                      {link.platform}: {link.username || link.url.replace(/https?:\/\//, "").substring(0, 20)}
                    </Text>
                  </Link>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right Column - Optimized Main Content */}
        <View style={styles.rightColumn}>
          {/* Professional Summary */}
          {basicInfo.summary && (
            <View style={styles.summarySection}>
              <Text style={styles.mainSectionTitle}>Summary</Text>
              <Text style={styles.summaryText}>{basicInfo.summary}</Text>
            </View>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <View style={styles.experienceSection}>
              <Text style={styles.mainSectionTitle}>Experience</Text>
              {experience.map((exp, index) => (
                <View key={`exp-${index}`} style={styles.experienceItem}>
                  <View style={styles.experienceHeader}>
                    <View style={styles.experienceLeft}>
                      <Text style={styles.experienceTitle}>{exp.position}</Text>
                      <Text style={styles.experienceCompany}>{exp.company}</Text>
                    </View>
                    <Text style={styles.experienceDate}>
                      {exp.startDate} - {exp.endDate}
                    </Text>
                  </View>
                  <Text style={styles.experienceDescription}>{exp.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <View style={styles.projectsSection}>
              <Text style={styles.mainSectionTitle}>Projects</Text>
              {projects.map((project, index) => (
                <View key={`proj-${index}`} style={styles.projectItem}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectTitle}>{project.name}</Text>
                    {(project.startDate || project.endDate) && (
                      <Text style={styles.projectDate}>
                        {project.startDate} {project.endDate && `- ${project.endDate}`}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.projectDescription}>{project.description}</Text>
                  <View style={styles.projectTech}>
                    {project.technologies.map((tech, techIndex) => (
                      <Text key={`tech-${techIndex}`} style={styles.techTag}>
                        {tech}
                      </Text>
                    ))}
                  </View>
                  {project.link && (
                    <Link src={project.link} style={styles.projectLink}>
                      <Text>View Project →</Text>
                    </Link>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <View style={styles.educationSection}>
              <Text style={styles.mainSectionTitle}>Education</Text>
              {education.map((edu, index) => (
                <View key={`edu-${index}`} style={styles.educationItem}>
                  <Text style={styles.educationDegree}>
                    {edu.degree} {edu.field && `in ${edu.field}`}
                  </Text>
                  <Text style={styles.educationInstitution}>{edu.institution}</Text>
                  <Text style={styles.educationDate}>
                    {edu.startDate} - {edu.endDate}
                  </Text>
                  {edu.gpa && <Text style={styles.educationGPA}>GPA: {edu.gpa}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Achievements */}
          {achievements && achievements.length > 0 && (
            <View style={styles.achievementsSection}>
              <Text style={styles.mainSectionTitle}>Achievements</Text>
              {achievements.map((achievement, index) => (
                <View key={`ach-${index}`} style={styles.achievementItem}>
                  <View style={styles.achievementHeader}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    {achievement.date && (
                      <Text style={styles.achievementDate}>{achievement.date}</Text>
                    )}
                  </View>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}