import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { germanForestSlateIcons } from "@/components/logos/resume_logos"
import { getResumeSectionTitles } from "@/lib/resume-section-titles"

/**
 * German Forest Slate Template (Simon Heinz style)
 * Replicates the clean German engineering resume layout:
 * - Forest Green header banner with circular avatar & crisp white typography
 * - Dark Charcoal left sidebar with white language bars, skills, and green square bullets
 * - White main content with forest green pill section badges and right-aligned dates
 */
const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: "#2D3748",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.35,
  },
  // Top Header Banner
  headerBanner: {
    backgroundColor: "#2E7D52",
    borderRadius: 6,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    marginRight: 20,
    backgroundColor: "#236541",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitials: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  candidateName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 4,
    lineHeight: 1.1,
  },
  candidateTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Oblique",
    color: "#E2F0E7",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  contactRows: {
    flexDirection: "column",
    gap: 3,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactIcon: {
    width: 10,
    height: 10,
    marginRight: 6,
  },
  contactText: {
    fontSize: 7.8,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  // Main Two-Column Layout
  bodyContainer: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
  },

  // Left Dark Charcoal Sidebar (~32%)
  leftSidebar: {
    width: "33%",
    backgroundColor: "#1F242C",
    paddingTop: 18,
    paddingBottom: 20,
    paddingLeft: 16,
    paddingRight: 16,
  },
  sidebarSection: {
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  languageItem: {
    marginBottom: 10,
  },
  languageName: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#F8FAFC",
    marginBottom: 3,
  },
  languageBarContainer: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 1.5,
    overflow: "hidden",
  },
  languageBarFill: {
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 1.5,
  },
  skillTextItem: {
    fontSize: 8,
    color: "#E2E8F0",
    lineHeight: 1.4,
    marginBottom: 7,
  },
  traitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  traitSquare: {
    width: 5,
    height: 5,
    backgroundColor: "#2E7D52",
    marginRight: 6,
    marginTop: 3,
  },
  traitText: {
    flex: 1,
    fontSize: 8,
    color: "#E2E8F0",
    lineHeight: 1.35,
  },

  // Right Content Column (~67%)
  rightContent: {
    width: "67%",
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 6,
  },
  contentSection: {
    marginBottom: 16,
  },
  sectionBadge: {
    backgroundColor: "#2E7D52",
    borderRadius: 3,
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    alignSelf: "flex-start",
    marginBottom: 9,
  },
  sectionBadgeText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryText: {
    fontSize: 8.2,
    color: "#2D3748",
    lineHeight: 1.45,
    marginBottom: 8,
  },

  // Experience & Education Timeline entries
  entryItem: {
    marginBottom: 12,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  entryRole: {
    flex: 1,
    fontSize: 8.7,
    fontFamily: "Helvetica-Bold",
    color: "#1A202C",
    paddingRight: 10,
  },
  entryDate: {
    fontSize: 7.8,
    color: "#718096",
    fontFamily: "Helvetica",
    textAlign: "right",
  },
  entrySubheader: {
    fontSize: 8,
    color: "#4A5568",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2.5,
    marginBottom: 1.5,
  },
  bulletDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#4A5568",
    marginTop: 4,
    marginRight: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 7.8,
    color: "#2D3748",
    lineHeight: 1.35,
  },
});

interface GermanForestSlateTemplateProps {
  resumeData: ResumeData;
  language?: string;
}

export function GermanForestSlateTemplate({
  resumeData,
  language = "de",
}: GermanForestSlateTemplateProps) {
  const titles = getResumeSectionTitles(language || resumeData.language || "de");
  const basicInfo = resumeData.basicInfo || ({} as any);
  const experience = resumeData.experience || [];
  const education = resumeData.education || [];
  const skills = resumeData.skills || [];
  const projects = resumeData.projects || [];
  const achievements = resumeData.achievements || [];
  const languages = basicInfo.languages || [];

  // Split skills into technical competencies and personal traits/strengths
  const technicalSkills = skills.slice(0, 6);
  const personalTraits =
    skills.length > 6
      ? skills.slice(6)
      : language === "de"
      ? [
          "Fähigkeit zur Teamarbeit",
          "Fähigkeit zur Problemlösung",
          "Kompetenz im Zeitmanagement",
          "Stärke im Projektmanagement",
          "Begeisterung für Technik",
        ]
      : [
          "Strong Team Player",
          "Analytical Problem Solving",
          "Time & Project Management",
          "Cross-functional Leadership",
          "Passion for Innovation",
        ];

  return (
    <Document title={`${basicInfo.name || "Resume"} - Lebenslauf`} author={basicInfo.name || "Career AI"}>
      <Page size="A4" style={styles.page}>
        {/* Top Forest Green Banner */}
        <View style={styles.headerBanner}>
          {/* Avatar Photo */}
          <View style={styles.avatarContainer}>
            {basicInfo.profilePicture ? (
              <Image src={basicInfo.profilePicture} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarInitials}>
                {basicInfo.name
                  ? basicInfo.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "SH"}
              </Text>
            )}
          </View>

          {/* Name & Contact Details */}
          <View style={styles.headerInfo}>
            <Text style={styles.candidateName}>{basicInfo.name || "SIMON HEINZ"}</Text>
            {basicInfo.title ? <Text style={styles.candidateTitle}>{basicInfo.title}</Text> : null}

            <View style={styles.contactRows}>
              {basicInfo.email ? (
                <View style={styles.contactItem}>
                  <Image src={germanForestSlateIcons.email} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{basicInfo.email}</Text>
                </View>
              ) : null}

              {basicInfo.phone ? (
                <View style={styles.contactItem}>
                  <Image src={germanForestSlateIcons.phone} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{basicInfo.phone}</Text>
                </View>
              ) : null}

              {basicInfo.location ? (
                <View style={styles.contactItem}>
                  <Image src={germanForestSlateIcons.location} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{basicInfo.location}</Text>
                </View>
              ) : null}

              {basicInfo.website ? (
                <View style={styles.contactItem}>
                  <Image src={germanForestSlateIcons.website} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{basicInfo.website.replace(/^https?:\/\//, "")}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Two-Column Body Content */}
        <View style={styles.bodyContainer}>
          {/* Left Dark Sidebar */}
          <View style={styles.leftSidebar}>
            {/* SPRACHEN (Languages) */}
            {languages.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>{titles.languages || "SPRACHEN"}</Text>
                {languages.map((lang, idx) => {
                  const parts = lang.split(/[:\-(]/);
                  const name = parts[0]?.trim() || lang;
                  const progressPct = idx === 0 ? "100%" : idx === 1 ? "85%" : "70%";
                  return (
                    <View key={idx} style={styles.languageItem}>
                      <Text style={styles.languageName}>{name}</Text>
                      <View style={styles.languageBarContainer}>
                        <View style={[styles.languageBarFill, { width: progressPct }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* FÄHIGKEITEN (Technical Skills) */}
            {technicalSkills.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>{titles.skills || "FÄHIGKEITEN"}</Text>
                {technicalSkills.map((sk, idx) => (
                  <Text key={idx} style={styles.skillTextItem}>
                    {sk}
                  </Text>
                ))}
              </View>
            )}

            {/* EIGENSCHAFTEN (Personal Strengths / Traits with Green Square Bullets) */}
            {personalTraits.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>
                  {language === "de" ? "EIGENSCHAFTEN" : "KEY STRENGTHS"}
                </Text>
                {personalTraits.map((trait, idx) => (
                  <View key={idx} style={styles.traitItem}>
                    <View style={styles.traitSquare} />
                    <Text style={styles.traitText}>{trait}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right White Main Column */}
          <View style={styles.rightContent}>
            {/* PROFIL (Summary) */}
            {basicInfo.summary ? (
              <View style={styles.contentSection}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{titles.summary || "PROFIL"}</Text>
                </View>
                <Text style={styles.summaryText}>{basicInfo.summary}</Text>
              </View>
            ) : null}

            {/* BERUFSERFAHRUNG (Work Experience) */}
            {experience.length > 0 && (
              <View style={styles.contentSection}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{titles.experience || "BERUFSERFAHRUNG"}</Text>
                </View>
                {experience.map((exp, idx) => (
                  <View key={idx} style={styles.entryItem}>
                    <View style={styles.entryHeaderRow}>
                      <Text style={styles.entryRole}>{exp.position}</Text>
                      <Text style={styles.entryDate}>
                        {exp.startDate} {exp.endDate ? `- ${exp.endDate}` : ""}
                      </Text>
                    </View>
                    {exp.company ? (
                      <Text style={styles.entrySubheader}>{exp.company}</Text>
                    ) : null}
                    {exp.description ? (
                      <Text style={styles.bulletText}>{exp.description}</Text>
                    ) : null}
                    {exp.highlights &&
                      exp.highlights.map((h, hIdx) => (
                        <View key={hIdx} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{h}</Text>
                        </View>
                      ))}
                  </View>
                ))}
              </View>
            )}

            {/* AUSBILDUNG (Education) */}
            {education.length > 0 && (
              <View style={styles.contentSection}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{titles.education || "AUSBILDUNG"}</Text>
                </View>
                {education.map((edu, idx) => (
                  <View key={idx} style={styles.entryItem}>
                    <View style={styles.entryHeaderRow}>
                      <Text style={styles.entryRole}>
                        {edu.degree} {edu.field ? `in ${edu.field}` : ""}
                      </Text>
                      <Text style={styles.entryDate}>
                        {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ""}
                      </Text>
                    </View>
                    {edu.institution ? (
                      <Text style={styles.entrySubheader}>{edu.institution}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {/* PROJEKTE (Projects - if present) */}
            {projects.length > 0 && (
              <View style={styles.contentSection}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{titles.projects || "PROJEKTE"}</Text>
                </View>
                {projects.map((proj, idx) => (
                  <View key={idx} style={styles.entryItem}>
                    <View style={styles.entryHeaderRow}>
                      <Text style={styles.entryRole}>{proj.name}</Text>
                      <Text style={styles.entryDate}>
                        {proj.startDate || proj.endDate || ""}
                      </Text>
                    </View>
                    {proj.description ? (
                      <Text style={styles.bulletText}>{proj.description}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {/* AUSZEICHNUNGEN (Achievements - if present) */}
            {achievements.length > 0 && (
              <View style={styles.contentSection}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {titles.achievements || "AUSZEICHNUNGEN"}
                  </Text>
                </View>
                {achievements.map((ach, idx) => (
                  <View key={idx} style={styles.entryItem}>
                    <View style={styles.entryHeaderRow}>
                      <Text style={styles.entryRole}>{ach.title}</Text>
                      {ach.date ? <Text style={styles.entryDate}>{ach.date}</Text> : null}
                    </View>
                    {ach.description ? (
                      <Text style={styles.bulletText}>{ach.description}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
