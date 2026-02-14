import type React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"

// Use only built-in fonts to avoid issues
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: "#333",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  name: {
    fontSize: 24,
    fontFamily: "Times-Bold",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 5,
  },
  contactItem: {
    marginHorizontal: 8,
    marginBottom: 5,
    fontSize: 9,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    marginBottom: 8,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#777",
    paddingBottom: 2,
  },
  experienceItem: {
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 11,
    fontFamily: "Times-Bold",
  },
  itemSubtitle: {
    fontSize: 10,
    fontFamily: "Times-Italic",
  },
  itemDate: {
    fontSize: 9,
  },
  itemDescription: {
    fontSize: 9,
    marginTop: 3,
    lineHeight: 1.4,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillItem: {
    width: "33%",
    marginBottom: 5,
    fontSize: 9,
    flexDirection: "row",
  },
  bullet: {
    marginRight: 5,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#777",
  },
  portfolioLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 5,
  },
  portfolioLink: {
    marginHorizontal: 8,
    marginBottom: 5,
    fontSize: 9,
  },
})

interface ClassicPDFTemplateProps {
  resumeData: ResumeData
}

export const ClassicPDFTemplate: React.FC<ClassicPDFTemplateProps> = ({ resumeData }) => {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Profile Picture */}
          {basicInfo.profilePicture ? (
            <Image src={basicInfo.profilePicture} style={styles.profileImage} cache={false} />
          ) : null}

          <Text style={styles.name}>{basicInfo.name}</Text>
          <Text style={styles.title}>{basicInfo.title}</Text>
          <View style={styles.contactInfo}>
            {basicInfo.email ? <Text style={styles.contactItem}>{basicInfo.email}</Text> : null}
            {basicInfo.phone ? <Text style={styles.contactItem}>{basicInfo.phone}</Text> : null}
            {basicInfo.location ? <Text style={styles.contactItem}>{basicInfo.location}</Text> : null}
            {basicInfo.linkedin ? <Text style={styles.contactItem}>LinkedIn: {basicInfo.linkedin}</Text> : null}
            {basicInfo.website ? <Text style={styles.contactItem}>{basicInfo.website}</Text> : null}
          </View>

          {/* Portfolio Links */}
          {basicInfo.portfolioLinks && basicInfo.portfolioLinks.length > 0 ? (
            <View style={styles.portfolioLinks}>
              {basicInfo.portfolioLinks.map((link, index) => (
                <Text key={`portfolio-${index}`} style={styles.portfolioLink}>
                  {link.platform}: {link.username || link.url}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {/* Summary */}
        {basicInfo.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{basicInfo.summary}</Text>
          </View>
        ) : null}

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Experience</Text>
          {experience.map((exp, index) => (
            <View key={`exp-${index}`} style={styles.experienceItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{exp.position}</Text>
                <Text style={styles.itemDate}>
                  {exp.startDate} - {exp.endDate}
                </Text>
              </View>
              <Text style={styles.itemSubtitle}>{exp.company}</Text>
              <Text style={styles.itemDescription}>{exp.description}</Text>
            </View>
          ))}
        </View>

        {/* Projects */}
        {projects && projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project, index) => (
              <View key={`proj-${index}`} style={styles.experienceItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{project.name}</Text>
                  {(project.startDate || project.endDate) ? (
                    <Text style={styles.itemDate}>
                      {project.startDate} - {project.endDate || "Present"}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.itemDescription}>{project.description}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 3 }}>
                  {(project.technologies || []).map((tech, techIndex) => (
                    <Text key={`tech-${techIndex}`} style={{ fontSize: 8, marginRight: 5 }}>
                      {typeof tech === "string" ? tech : String(tech)}
                      {techIndex < (project.technologies || []).length - 1 ? "," : ""}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {education.map((edu, index) => (
            <View key={`edu-${index}`} style={styles.experienceItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{edu.institution}</Text>
                <Text style={styles.itemDate}>
                  {edu.startDate} - {edu.endDate}
                </Text>
              </View>
              <Text style={styles.itemSubtitle}>
                {edu.degree}{edu.field ? ` in ${edu.field}` : ""}{edu.gpa ? `, GPA: ${edu.gpa}` : ""}
              </Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        {achievements && achievements.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
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
        ) : null}

        {/* Languages */}
        {basicInfo.languages && basicInfo.languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.skillsContainer}>
              {basicInfo.languages.map((language, index) => (
                <View key={`lang-${index}`} style={styles.skillItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text>{language}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {skills.map((skill, index) => (
              <View key={`skill-${index}`} style={styles.skillItem}>
                <Text style={styles.bullet}>•</Text>
                <Text>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  )
}
