import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { getResumeSectionTitles } from "@/lib/resume-section-titles"

// Define ALL style objects outside the component - this is critical!
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
  // Define link styles as static objects
  linkStyle: {
    textDecoration: "none",
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
  // CRITICAL FIX: Safe destructuring with defaults
  const basicInfo = resumeData?.basicInfo || {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    summary: "",
    profilePicture: "",
    languages: [],
    portfolioLinks: [],
  }
  
  const experience = Array.isArray(resumeData?.experience) ? resumeData.experience : []
  const education = Array.isArray(resumeData?.education) ? resumeData.education : []
  const skills = Array.isArray(resumeData?.skills) ? resumeData.skills : []
  const projects = Array.isArray(resumeData?.projects) ? resumeData.projects : []
  const achievements = Array.isArray(resumeData?.achievements) ? resumeData.achievements : []
  const titles = getResumeSectionTitles(resumeData?.language)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View key="k-hdr" style={styles.header}>
          {/* Profile Picture - Removed cache prop for production safety */}
          {basicInfo.profilePicture && (
            <Image key="k-pic" src={basicInfo.profilePicture} style={styles.profileImage} />
          )}

          <View key="k-hdr-cnt" style={styles.headerContent}>
            <Text key="k-name" style={styles.name}>{basicInfo.name || "Your Name"}</Text>
            {basicInfo.title && <Text key="k-title" style={styles.title}>{basicInfo.title}</Text>}
            
            <View key="k-contact" style={styles.contactInfo}>
              {basicInfo.email && (
                <View key="k-eml" style={styles.contactItem}>
                  <Text key="k-eml-l">{titles.email} </Text>
                  <Link key="k-eml-a" src={`mailto:${basicInfo.email}`} style={styles.linkStyle}>
                    <Text>{basicInfo.email}</Text>
                  </Link>
                </View>
              )}
              
              {basicInfo.phone && (
                <View key="k-phn" style={styles.contactItem}>
                  <Text key="k-phn-l">{titles.phone} </Text>
                  <Link key="k-phn-a" src={`tel:${basicInfo.phone.replace(/[^\d+]/g, "")}`} style={styles.linkStyle}>
                    <Text>{basicInfo.phone}</Text>
                  </Link>
                </View>
              )}
              
              {basicInfo.location && (
                <View key="k-loc" style={styles.contactItem}>
                  <Text key="k-loc-l">{titles.location} {basicInfo.location}</Text>
                </View>
              )}
              
              {basicInfo.linkedin && (
                <View key="k-in" style={styles.contactItem}>
                  <Link
                    key="k-in-a"
                    src={`https://linkedin.com/in/${basicInfo.linkedin}`}
                    style={styles.linkStyle}
                  >
                    <Text>LinkedIn: {basicInfo.linkedin}</Text>
                  </Link>
                </View>
              )}
              
              {basicInfo.website && (
                <View key="k-web" style={styles.contactItem}>
                  <Link
                    key="k-web-a"
                    src={basicInfo.website.startsWith("http") ? basicInfo.website : `https://${basicInfo.website}`}
                    style={styles.linkStyle}
                  >
                    <Text>Website: {basicInfo.website}</Text>
                  </Link>
                </View>
              )}
            </View>

            {/* Portfolio Links */}
            {Array.isArray(basicInfo.portfolioLinks) && basicInfo.portfolioLinks.length > 0 && (
              <View key="k-pf-wrap" style={styles.portfolioLinks}>
                {basicInfo.portfolioLinks.map((link, index) => {
                  const url = link?.url || ""
                  const platform = link?.platform || "Link"
                  const username = link?.username || url
                  const fullUrl = url.startsWith("http") ? url : `https://${url || platform}`
                  
                  return (
                    <View key={`pf-${index}`} style={styles.portfolioLink}>
                      <Link src={fullUrl} style={styles.linkStyle}>
                        <Text>
                          {platform}: {username}
                        </Text>
                      </Link>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        </View>

        {/* Summary */}
        {basicInfo.summary && (
          <View key="k-sum" style={styles.section}>
            <Text key="k-sum-t" style={styles.sectionTitle}>{titles.summary}</Text>
            <Text key="k-sum-c" style={styles.summary}>{basicInfo.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View key="k-exp" style={styles.section}>
            <Text key="k-exp-t" style={styles.sectionTitle}>{titles.experience}</Text>
            <View key="k-exp-c" style={styles.sectionContent}>
              {experience.map((exp, index) => (
                <View key={`exp-${index}`} style={styles.experienceItem}>
                  <View key={`eh-${index}`} style={styles.itemHeader}>
                    <View key={`em-${index}`}>
                      <Text key={`ep-${index}`} style={styles.itemTitle}>{exp?.position || "Position"}</Text>
                      <Text key={`ec-${index}`} style={styles.itemSubtitle}>{exp?.company || "Company"}</Text>
                    </View>
                    <Text key={`ed-${index}`} style={styles.itemDate}>
                      {exp?.startDate || ""} - {exp?.endDate || titles.present}
                    </Text>
                  </View>
                  {exp?.description && (
                    <Text key={`exd-${index}`} style={styles.itemDescription}>{exp.description}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View key="k-prj" style={styles.section}>
            <Text key="k-prj-t" style={styles.sectionTitle}>{titles.projects}</Text>
            <View key="k-prj-c" style={styles.sectionContent}>
              {projects.map((project, index) => {
                const technologies = Array.isArray(project?.technologies) ? project.technologies : []
                
                return (
                  <View key={`proj-${index}`} style={styles.experienceItem}>
                    <View key={`ph-${index}`} style={styles.itemHeader}>
                      <View key={`pm-${index}`}>
                        <Text key={`pn-${index}`} style={styles.itemTitle}>{project?.name || "Project"}</Text>
                        {technologies.length > 0 && (
                          <View key={`pt-${index}`} style={styles.projectTech}>
                            {technologies.map((tech, techIndex) => (
                              <Text key={`t-${index}-${techIndex}`} style={styles.techBadge}>
                                {String(tech)}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                      {(project?.startDate || project?.endDate) && (
                        <Text key={`pd-${index}`} style={styles.itemDate}>
                          {project.startDate || ""} - {project.endDate || titles.present}
                        </Text>
                      )}
                    </View>
                    {project?.description && (
                      <Text key={`pds-${index}`} style={styles.itemDescription}>{project.description}</Text>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View key="k-edu" style={styles.section}>
            <Text key="k-edu-t" style={styles.sectionTitle}>{titles.education}</Text>
            <View key="k-edu-c" style={styles.sectionContent}>
              {education.map((edu, index) => (
                <View key={`edu-${index}`} style={styles.experienceItem}>
                  <View key={`edh-${index}`} style={styles.itemHeader}>
                    <View key={`edm-${index}`}>
                      <Text key={`edi-${index}`} style={styles.itemTitle}>{edu?.institution || "Institution"}</Text>
                      <Text key={`edd-${index}`} style={styles.itemSubtitle}>
                        {edu?.degree || "Degree"}
                        {edu?.field ? ` in ${edu.field}` : ""}
                      </Text>
                    </View>
                    <Text key={`eddt-${index}`} style={styles.itemDate}>
                      {edu?.startDate || ""} - {edu?.endDate || titles.present}
                    </Text>
                  </View>
                  {edu?.gpa && (
                    <Text key={`edg-${index}`} style={styles.itemDescription}>GPA: {edu.gpa}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <View key="k-ach" style={styles.section}>
            <Text key="k-ach-t" style={styles.sectionTitle}>{titles.achievements}</Text>
            <View key="k-ach-c" style={styles.sectionContent}>
              {achievements.map((achievement, index) => (
                <View key={`ach-${index}`} style={styles.experienceItem}>
                  <View key={`achh-${index}`} style={styles.itemHeader}>
                    <Text key={`acht-${index}`} style={styles.itemTitle}>{achievement?.title || "Achievement"}</Text>
                    {achievement?.date && (
                      <Text key={`achd-${index}`} style={styles.itemDate}>{achievement.date}</Text>
                    )}
                  </View>
                  {achievement?.description && (
                    <Text key={`achds-${index}`} style={styles.itemDescription}>{achievement.description}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {Array.isArray(basicInfo.languages) && basicInfo.languages.length > 0 && (
          <View key="k-lng" style={styles.section}>
            <Text key="k-lng-t" style={styles.sectionTitle}>{titles.languages}</Text>
            <View key="k-lng-c" style={styles.skillsContainer}>
              {basicInfo.languages.map((language, index) => (
                <Text key={`lang-${index}`} style={styles.skillBadge}>
                  {String(language)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View key="k-skl" style={styles.section}>
            <Text key="k-skl-t" style={styles.sectionTitle}>{titles.skills}</Text>
            <View key="k-skl-c" style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <Text key={`skill-${index}`} style={styles.skillBadge}>
                  {String(skill)}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}