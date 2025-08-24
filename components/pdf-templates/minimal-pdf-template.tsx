import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"

// Use only built-in fonts to avoid issues
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    marginBottom: 25,
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica",
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: "#555",
    marginBottom: 5,
  },
  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 8,
    color: "#777",
  },
  contactItem: {
    marginRight: 5,
  },
  contactDivider: {
    marginHorizontal: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#777",
    marginBottom: 10,
    fontFamily: "Helvetica-Bold",
  },
  experienceItem: {
    marginBottom: 12,
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
    marginBottom: 3,
  },
  itemDate: {
    fontSize: 9,
    color: "#777",
  },
  itemDescription: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    padding: "3 6",
    marginRight: 5,
    marginBottom: 5,
    fontSize: 8,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  portfolioLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 8,
    color: "#777",
    marginTop: 5,
  },
  portfolioLink: {
    marginRight: 5,
  },
  portfolioDivider: {
    marginHorizontal: 3,
  },
})

interface MinimalPDFTemplateProps {
  resumeData: ResumeData
}

export const MinimalPDFTemplate: React.FC<MinimalPDFTemplateProps> = ({ resumeData }) => {
  const { basicInfo, experience, education, skills, projects, achievements } = resumeData

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
              {basicInfo.email && <Text style={styles.contactItem}>{basicInfo.email}</Text>}
              {basicInfo.email && basicInfo.phone && <Text style={styles.contactDivider}>•</Text>}
              {basicInfo.phone && <Text style={styles.contactItem}>{basicInfo.phone}</Text>}
              {basicInfo.phone && basicInfo.location && <Text style={styles.contactDivider}>•</Text>}
              {basicInfo.location && <Text style={styles.contactItem}>{basicInfo.location}</Text>}
              {basicInfo.location && basicInfo.linkedin && <Text style={styles.contactDivider}>•</Text>}
              {basicInfo.linkedin && <Text style={styles.contactItem}>{basicInfo.linkedin}</Text>}
              {basicInfo.linkedin && basicInfo.website && <Text style={styles.contactDivider}>•</Text>}
              {basicInfo.website && <Text style={styles.contactItem}>{basicInfo.website}</Text>}
            </View>

            {/* Portfolio Links */}
            {basicInfo.portfolioLinks && basicInfo.portfolioLinks.length > 0 && (
              <View style={styles.portfolioLinks}>
                {basicInfo.portfolioLinks.map((link, index) => (
                  <React.Fragment key={`portfolio-${index}`}>
                    {index > 0 && <Text style={styles.portfolioDivider}>•</Text>}
                    <Text style={styles.portfolioLink}>
                      {link.platform}: {link.username || link.url}
                    </Text>
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Summary */}
        {basicInfo.summary && <Text style={styles.summary}>{basicInfo.summary}</Text>}

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
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
        {projects && projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
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
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 3 }}>
                  {project.technologies.map((tech, techIndex) => (
                    <Text key={`tech-${techIndex}`} style={styles.skillBadge}>
                      {tech}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

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
                {edu.degree} {edu.field && `in ${edu.field}`}
                {edu.gpa && <Text style={{ fontSize: 8 }}> GPA: {edu.gpa}</Text>}
              </Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
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
