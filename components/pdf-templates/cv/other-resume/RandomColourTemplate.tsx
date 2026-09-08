import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { lightIconUrls } from "@/components/logos/logos"

// Color palette array for different gradient themes
const colorPalettes = [
  {
    name: "Ocean Blue",
    primary: "#1e3a8a",
    secondary: "#1e40af",
    accent: "#3b82f6",
    light: "#dbeafe",
  },
  {
    name: "Purple Dream",
    primary: "#581c87",
    secondary: "#7c3aed",
    accent: "#a855f7",
    light: "#e9d5ff",
  },
  {
    name: "Forest Green",
    primary: "#14532d",
    secondary: "#16a34a",
    accent: "#22c55e",
    light: "#dcfce7",
  },
  {
    name: "Sunset Orange",
    primary: "#9a3412",
    secondary: "#ea580c",
    accent: "#f97316",
    light: "#fed7aa",
  },
  {
    name: "Rose Pink",
    primary: "#881337",
    secondary: "#e11d48",
    accent: "#f43f5e",
    light: "#fce7f3",
  },
  {
    name: "Teal Mint",
    primary: "#134e4a",
    secondary: "#0d9488",
    accent: "#14b8a6",
    light: "#ccfbf1",
  },
  {
    name: "Royal Purple",
    primary: "#4c1d95",
    secondary: "#6d28d9",
    accent: "#8b5cf6",
    light: "#e9d5ff",
  },
  {
    name: "Crimson Red",
    primary: "#7f1d1d",
    secondary: "#dc2626",
    accent: "#ef4444",
    light: "#fee2e2",
  },
  {
    name: "Navy Steel",
    primary: "#1e293b",
    secondary: "#334155",
    accent: "#64748b",
    light: "#e2e8f0",
  },
  {
    name: "Emerald Jade",
    primary: "#064e3b",
    secondary: "#059669",
    accent: "#10b981",
    light: "#d1fae5",
  }
]

// Function to get color palette (cycles through array)
const getColorPalette = (index: number = 0) => {
  return colorPalettes[index % colorPalettes.length]
}

// Dynamic styles function that accepts color palette
const createStyles = (palette: typeof colorPalettes[0]) => StyleSheet.create({
  page: {
    padding: "15 20",
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#ffffff",
    backgroundColor: palette.primary,
    lineHeight: 1.3,
  },

  header: {
    flexDirection: "row",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
    borderBottomStyle: "solid",
    alignItems: "flex-start",
  },

  profileImageContainer: {
    marginRight: 14,
    flexShrink: 0,
    alignSelf: "center",
  },

  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
    objectFit: "cover",
  },

  headerContent: {
    flex: 1,
  },

  name: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: "#ffffff",
    letterSpacing: 0.3,
    lineHeight: 1.2,
  },

  title: {
    fontSize: 10.5,
    marginBottom: 6,
    color: palette.light,
    fontFamily: "Helvetica-Oblique",
    lineHeight: 1.25,
  },

  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: 8,
    color: "#ffffff",
    backgroundColor: `rgba(255, 255, 255, 0.15)`,
    padding: "3 6",
    borderRadius: 3,
    marginRight: 6,
    marginBottom: 4,
  },

  contactIcon: {
    width: 10,
    height: 10,
    marginRight: 4,
    tintColor: "#ffffff",
  },

  contactLink: {
    color: "#ffffff",
    textDecoration: "none",
  },

  portfolioLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  portfolioLink: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: 8,
    color: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: "3 6",
    borderRadius: 3,
    marginRight: 6,
    marginBottom: 4,
  },

  section: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.4)",
    borderBottomStyle: "solid",
  },

  sectionContent: {
    marginLeft: 0,
  },

  summary: {
    fontSize: 9,
    lineHeight: 1.3,
    color: "#ffffff",
    backgroundColor: `rgba(255, 255, 255, 0.1)`,
    padding: 10,
    borderRadius: 5,
    borderLeft: "3px solid rgba(255, 255, 255, 0.6)",
  },

  experienceItem: {
    marginBottom: 10,
    paddingLeft: 10,
    paddingBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(255, 255, 255, 0.6)",
    borderLeftStyle: "solid",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },

  itemHeader: {
    marginBottom: 4,
  },

  itemTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },

  itemTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    flex: 1,
    marginRight: 8,
  },

  itemSubtitle: {
    fontSize: 9,
    color: palette.light,
    marginBottom: 2,
  },

  itemDate: {
    fontSize: 8,
    color: palette.light,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: "2 6",
    borderRadius: 3,
    alignSelf: "flex-start",
  },

  itemDescription: {
    fontSize: 8,
    marginTop: 3,
    lineHeight: 1.3,
    color: "#f1f5f9",
  },

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },

  skillBadge: {
    backgroundColor: `rgba(255, 255, 255, 0.25)`,
    borderRadius: 8,
    padding: "3 6",
    fontSize: 8,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    marginRight: 5,
    marginBottom: 4,
  },

  projectTech: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginBottom: 4,
  },

  techBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    padding: "1 4",
    fontSize: 7,
    color: palette.light,
    marginRight: 4,
    marginBottom: 3,
  },

  twoColumnContainer: {
    flexDirection: "row",
    marginTop: 10,
  },

  column: {
    flex: 1,
    marginRight: 10,
  },

  projectLink: {
    color: palette.light,
    textDecoration: "none",
    fontSize: 8,
    marginTop: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: "2 6",
    borderRadius: 3,
    alignSelf: "flex-start",
  },

  languageItem: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 8,
    padding: "3 6",
    fontSize: 8,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    marginRight: 5,
    marginBottom: 5,
  },

  achievementItem: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(255, 255, 255, 0.4)",
    borderLeftStyle: "solid",
  },

  achievementTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 2,
  },

  achievementDate: {
    fontSize: 8,
    color: palette.light,
    marginBottom: 3,
  },

  achievementDescription: {
    fontSize: 8,
    color: "#f1f5f9",
    lineHeight: 1.3,
  },

  projectItem: {
    marginBottom: 8,
    paddingLeft: 10,
    paddingBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(255, 255, 255, 0.6)",
    borderLeftStyle: "solid",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },

  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },

  projectTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    flex: 1,
    marginRight: 8,
  },

  projectDescription: {
    fontSize: 8,
    color: "#f1f5f9",
    lineHeight: 1.3,
    marginBottom: 4,
  },

  // Color palette indicator (optional)
  paletteIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accent,
  },
})

interface MultiColorfulGradientPDFTemplateProps {
  resumeData: ResumeData
  colorIndex?: number // Optional prop to select color palette
}

export const MultiColorfulGradientPDFTemplate = ({ 
  resumeData, 
  colorIndex = Math.floor(Math.random() * colorPalettes.length) // Random color by default
}: MultiColorfulGradientPDFTemplateProps) => {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  // Get the selected color palette
  const selectedPalette = getColorPalette(colorIndex)
  const styles = createStyles(selectedPalette)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Optional color palette indicator */}
        <View style={styles.paletteIndicator} />

        {/* Header Section */}
        <View style={styles.header}>
          {/* Profile Picture */}
          {basicInfo.profilePicture ? (
            <View style={styles.profileImageContainer}>
              <Image 
                src={basicInfo.profilePicture} 
                style={styles.profileImage} 
                cache={false} 
              />
            </View>
          ) : null}

          <View style={styles.headerContent}>
            <Text style={styles.name}>{basicInfo.name}</Text>
            <Text style={styles.title}>{basicInfo.title}</Text>

            {/* Contact Information */}
            <View style={styles.contactInfo}>
              {basicInfo.email ? (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.email || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link src={`mailto:${basicInfo.email}`} style={styles.contactLink}>
                    <Text>{basicInfo.email}</Text>
                  </Link>
                </View>
              ) : null}
              {basicInfo.phone ? (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.phone || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link src={`tel:${basicInfo.phone.replace(/[^\d+]/g, "")}`} style={styles.contactLink}>
                    <Text>{basicInfo.phone}</Text>
                  </Link>
                </View>
              ) : null}
              {basicInfo.location ? (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.location || "/placeholder.svg"} style={styles.contactIcon} />
                  <Text>{basicInfo.location}</Text>
                </View>
              ) : null}
              {basicInfo.linkedin ? (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.linkedin || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link src={`https://linkedin.com/in/${basicInfo.linkedin}`} style={styles.contactLink}>
                    <Text>{basicInfo.linkedin}</Text>
                  </Link>
                </View>
              ) : null}
              {basicInfo.website ? (
                <View style={styles.contactItem}>
                  <Image src={lightIconUrls.website || "/placeholder.svg"} style={styles.contactIcon} />
                  <Link
                    src={basicInfo.website.startsWith("http") ? basicInfo.website : `https://${basicInfo.website}`}
                    style={styles.contactLink}
                  >
                    <Text>{basicInfo.website}</Text>
                  </Link>
                </View>
              ) : null}
            </View>

            {/* Portfolio Links */}
            {basicInfo.portfolioLinks && basicInfo.portfolioLinks.length > 0 ? (
              <View style={styles.portfolioLinks}>
                {basicInfo.portfolioLinks.map((link, index) => (
                  <View key={`portfolio-${index}`} style={styles.portfolioLink}>
                    <Image
                      src={link.platform === "GitHub" ? lightIconUrls.github : lightIconUrls.externalLink}
                      style={styles.contactIcon}
                    />
                    <Link src={link.url} style={styles.contactLink}>
                      <Text>
                        {link.platform}: {link.username || link.url.replace(/https?:\/\//, "").substring(0, 15)}
                      </Text>
                    </Link>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Summary Section */}
        {basicInfo.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{basicInfo.summary}</Text>
          </View>
        ) : null}

        {/* Two Column Layout */}
        <View style={styles.twoColumnContainer}>
          {/* Left Column - Experience, Education, Skills, Achievements */}
          <View style={styles.column}>
            {/* Experience Section */}
            {experience && experience.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
                <View style={styles.sectionContent}>
                  {experience.map((exp, index) => (
                    <View key={`exp-${index}`} style={styles.experienceItem}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemTitleRow}>
                          <Text style={styles.itemTitle}>{exp.position}</Text>
                          <Text style={styles.itemDate}>
                            {exp.startDate} - {exp.endDate}
                          </Text>
                        </View>
                        <Text style={styles.itemSubtitle}>{exp.company}</Text>
                      </View>
                      <Text style={styles.itemDescription}>{exp.description}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Education Section */}
            {education && education.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                <View style={styles.sectionContent}>
                  {education.map((edu, index) => (
                    <View key={`edu-${index}`} style={styles.experienceItem}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemTitleRow}>
                          <Text style={styles.itemTitle}>
                            {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                          </Text>
                          <Text style={styles.itemDate}>
                            {edu.startDate} - {edu.endDate}
                          </Text>
                        </View>
                        <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                      </View>
                      {edu.gpa ? <Text style={styles.itemDescription}>GPA: {edu.gpa}</Text> : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Skills Section */}
            {skills && skills.length > 0 ? (
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
            ) : null}

            {/* Achievements Section - MOVED TO LEFT SIDE */}
            {achievements && achievements.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <View style={styles.sectionContent}>
                  {achievements.map((achievement, index) => (
                    <View key={`ach-${index}`} style={styles.achievementItem}>
                      <Text style={styles.achievementTitle}>{achievement.title}</Text>
                      {achievement.date ? (
                        <Text style={styles.achievementDate}>{achievement.date}</Text>
                      ) : null}
                      <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Right Column - Projects and Languages */}
          <View style={styles.column}>
            {/* Projects Section */}
            {projects && projects.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Projects</Text>
                <View style={styles.sectionContent}>
                  {projects.map((project, index) => (
                    <View key={`proj-${index}`} style={styles.projectItem}>
                      <View style={styles.projectHeader}>
                        <Text style={styles.projectTitle}>{project.name}</Text>
                        {(project.startDate || project.endDate) ? (
                          <Text style={styles.itemDate}>
                            {project.startDate} - {project.endDate || "Present"}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.projectDescription}>{project.description}</Text>
                      <View style={styles.projectTech}>
                        {(project.technologies || []).map((tech, techIndex) => (
                          <Text key={`tech-${techIndex}`} style={styles.techBadge}>
                            {typeof tech === "string" ? tech : String(tech)}
                          </Text>
                        ))}
                      </View>
                      {project.link ? (
                        <Link src={project.link} style={styles.projectLink}>
                          <Text>View →</Text>
                        </Link>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Languages Section */}
            {basicInfo.languages && basicInfo.languages.length > 0 ? (
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
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  )
}

// Export color palettes for UI selection
export { colorPalettes, getColorPalette }