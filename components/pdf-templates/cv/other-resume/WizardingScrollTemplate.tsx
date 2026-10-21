import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { wizardingScrollIcons } from "@/components/logos/resume_logos"
import { getResumeSectionTitles } from "@/lib/resume-section-titles"

/**
 * Wizarding World Parchment Scroll Template (Harry Potter style)
 * Faithfully replicates the vintage magical manuscript from Image 3:
 * - Antique warm parchment background & double-line border
 * - Top Hogwarts crests & large calligraphic serif name banner
 * - "Personal Data" with Owl-post coordinates
 * - Dual column: "Chronicles of Experience", "Magical Skills & Spells"
 * - Vintage wax seal ribbon, quill & inkpot, and magic wand vector ornaments
 * - Zero unicode character corruption (no broken &, ¡, \ symbols)
 */
const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: "Times-Roman",
    fontSize: 8,
    color: "#24160E",
    backgroundColor: "#F4ECDC",
    lineHeight: 1.3,
  },
  parchmentScroll: {
    position: "relative",
    borderWidth: 2,
    borderColor: "#58381E",
    borderRadius: 8,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flex: 1,
    backgroundColor: "#FDF9EF",
  },

  // Ornate Corner Flourishes
  cornerTL: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 20,
    height: 20,
  },
  cornerTR: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    transform: "scaleX(-1)",
  },
  cornerBL: {
    position: "absolute",
    bottom: 4,
    left: 4,
    width: 20,
    height: 20,
    transform: "scaleY(-1)",
  },
  cornerBR: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    transform: "scale(-1)",
  },

  // Top Banner with Crests
  topCrestsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  crestImg: {
    width: 26,
    height: 32,
  },
  grandTitle: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    color: "#1A0E08",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  dividerImg: {
    width: "70%",
    height: 10,
    alignSelf: "center",
    marginVertical: 4,
  },

  // Subheader: Candidate & Personal Data + Avatar
  subHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#CBB387",
    paddingBottom: 6,
  },
  subHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },
  candidateFullName: {
    fontSize: 12.5,
    fontFamily: "Times-Bold",
    color: "#2A1810",
    letterSpacing: 0.5,
  },
  candidateTitle: {
    fontSize: 8,
    fontFamily: "Times-Italic",
    color: "#5C3A21",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
    marginBottom: 4,
  },
  personalDataBox: {
    marginTop: 2,
  },
  personalDataTitle: {
    fontSize: 8.5,
    fontFamily: "Times-Bold",
    color: "#3E2718",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  personalDataItem: {
    fontSize: 7.2,
    color: "#4A3222",
    lineHeight: 1.3,
  },

  // Portrait Container
  avatarFrame: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: "#8C6836",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFE1C9",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitials: {
    fontSize: 18,
    fontFamily: "Times-Bold",
    color: "#5C3A21",
  },

  // Dual Column Layout
  columnsRow: {
    flexDirection: "row",
    gap: 16,
    flex: 1,
  },
  columnLeft: {
    flex: 1.05,
    borderRightWidth: 1,
    borderRightColor: "#E2D3B3",
    paddingRight: 12,
  },
  columnRight: {
    flex: 0.95,
  },

  // Section Headers
  sectionHeader: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#8C6836",
    paddingBottom: 2,
    marginTop: 6,
    marginBottom: 4,
  },
  sectionTitleText: {
    fontSize: 9,
    fontFamily: "Times-Bold",
    color: "#2A1810",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Experience Entries
  entryContainer: {
    marginBottom: 5,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  entryRole: {
    fontSize: 8,
    fontFamily: "Times-Bold",
    color: "#1A0E08",
    flex: 1,
    paddingRight: 6,
  },
  entryDates: {
    fontSize: 7.2,
    fontFamily: "Times-Italic",
    color: "#6B5239",
    textAlign: "right",
  },
  entryCompany: {
    fontSize: 7.5,
    fontFamily: "Times-Bold",
    color: "#5C3A21",
    marginBottom: 1,
  },
  entryDesc: {
    fontSize: 7,
    lineHeight: 1.3,
    color: "#3E2B1E",
    marginBottom: 1,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 1,
  },
  bulletDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: "#5C3A21",
    marginTop: 3.5,
    marginRight: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 6.9,
    lineHeight: 1.25,
    color: "#3E2B1E",
  },

  // Education Items
  eduContainer: {
    marginBottom: 4,
  },
  eduDegree: {
    fontSize: 7.8,
    fontFamily: "Times-Bold",
    color: "#1A0E08",
  },
  eduInstitution: {
    fontSize: 7.2,
    fontFamily: "Times-Italic",
    color: "#4A3222",
  },

  // Skills Group
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3.5,
    marginTop: 2,
    marginBottom: 4,
  },
  skillPill: {
    backgroundColor: "#F5ECD7",
    borderWidth: 1,
    borderColor: "#C5AE82",
    borderRadius: 4,
    paddingVertical: 1.5,
    paddingHorizontal: 5,
  },
  skillText: {
    fontSize: 6.8,
    fontFamily: "Times-Bold",
    color: "#3A2415",
  },

  // Projects
  projectContainer: {
    marginBottom: 3.5,
  },
  projectName: {
    fontSize: 7.8,
    fontFamily: "Times-Bold",
    color: "#1A0E08",
  },
  projectDesc: {
    fontSize: 6.9,
    lineHeight: 1.25,
    color: "#3E2B1E",
    marginTop: 1,
  },

  // Achievements with Wax Seal
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FBF3E2",
    borderWidth: 1,
    borderColor: "#D8C5A0",
    borderRadius: 6,
    padding: 4,
    marginTop: 2,
  },
  waxSealImg: {
    width: 22,
    height: 28,
  },
  achievementTitle: {
    fontSize: 7.6,
    fontFamily: "Times-Bold",
    color: "#7F1D1D",
  },
  achievementDesc: {
    fontSize: 6.8,
    color: "#4A3222",
  },

  // Bottom Illustrations
  bottomDecorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 6,
    paddingTop: 4,
  },
  quillImg: {
    width: 32,
    height: 32,
  },
  wandImg: {
    width: 32,
    height: 32,
  },
});

interface WizardingScrollTemplateProps {
  resumeData: ResumeData;
  language?: string;
}

export function WizardingScrollTemplate({
  resumeData,
  language = "en",
}: WizardingScrollTemplateProps) {
  const basicInfo = resumeData.basicInfo || ({} as any);
  const experience = resumeData.experience || [];
  const education = resumeData.education || [];
  const skills = resumeData.skills || [];
  const projects = resumeData.projects || [];
  const achievements = resumeData.achievements || [];

  return (
    <Document title={`${basicInfo.name || "Wizard"} - Wizarding Scroll`} author="Hogwarts Registry">
      <Page size="A4" style={styles.page}>
        <View style={styles.parchmentScroll}>
          {/* Corner Flourishes */}
          <Image src={wizardingScrollIcons.cornerFlourish} style={styles.cornerTL} />
          <Image src={wizardingScrollIcons.cornerFlourish} style={styles.cornerTR} />
          <Image src={wizardingScrollIcons.cornerFlourish} style={styles.cornerBL} />
          <Image src={wizardingScrollIcons.cornerFlourish} style={styles.cornerBR} />

          {/* Top Banner with Hogwarts Crests */}
          <View style={styles.topCrestsRow}>
            <Image src={wizardingScrollIcons.crest} style={styles.crestImg} />
            <Text style={styles.grandTitle}>WIZARDING CURRICULUM VITAE</Text>
            <Image src={wizardingScrollIcons.crest} style={styles.crestImg} />
          </View>

          {/* Ornamental Divider */}
          <Image src={wizardingScrollIcons.dividerFlourish} style={styles.dividerImg} />

          {/* Subheader: Candidate Details & Personal Data */}
          <View style={styles.subHeaderRow}>
            <View style={styles.subHeaderLeft}>
              <Text style={styles.candidateFullName}>
                {basicInfo.name || "Venkata Sai Yakkshit Reddy Asodi"}
              </Text>
              <Text style={styles.candidateTitle}>
                {basicInfo.title || "FULL-STACK ENGINEER (WEB & DATA APPLICATIONS)"}
              </Text>

              <View style={styles.personalDataBox}>
                <Text style={styles.personalDataTitle}>Personal Data</Text>
                <Text style={styles.personalDataItem}>
                  House: Ravenclaw (or customized as desired)
                </Text>
                <Text style={styles.personalDataItem}>
                  Hometown: Pallet Town of the Wizarding World
                </Text>
                <Text style={styles.personalDataItem}>
                  Owl-post coordinates: {[basicInfo.email, basicInfo.location, basicInfo.phone].filter(Boolean).join(" | ")}
                </Text>
              </View>
            </View>

            {/* Candidate Portrait */}
            <View style={styles.avatarFrame}>
              {basicInfo.profilePicture ? (
                <Image src={basicInfo.profilePicture} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitials}>
                  {basicInfo.name
                    ? basicInfo.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "HP"}
                </Text>
              )}
            </View>
          </View>

          {/* Dual Columns */}
          <View style={styles.columnsRow}>
            {/* Left Column: Chronicles of Experience & Education */}
            <View style={styles.columnLeft}>
              {/* Experience */}
              {experience.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitleText}>
                      {language === "de" ? "CHRONIK DER ERFAHRUNG" : "CHRONICLES OF EXPERIENCE"}
                    </Text>
                  </View>

                  {experience.map((exp, idx) => (
                    <View key={idx} style={styles.entryContainer}>
                      <View style={styles.entryHeaderRow}>
                        <Text style={styles.entryRole}>* {exp.position}</Text>
                        <Text style={styles.entryDates}>
                          {exp.startDate} - {exp.endDate || "Present"}
                        </Text>
                      </View>
                      <Text style={styles.entryCompany}>{exp.company}</Text>
                      {exp.description ? (
                        <Text style={styles.entryDesc}>{exp.description}</Text>
                      ) : null}
                      {exp.highlights?.map((h, hIdx) => (
                        <View key={hIdx} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <Text style={styles.bulletText}>{h}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Education */}
              {education.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitleText}>
                      {language === "de" ? "AUSBILDUNG & LEHRE" : "EDUCATION & APPRENTICESHIPS"}
                    </Text>
                  </View>

                  {education.map((edu, idx) => (
                    <View key={idx} style={styles.eduContainer}>
                      <View style={styles.entryHeaderRow}>
                        <Text style={styles.eduDegree}>* {edu.degree}</Text>
                        <Text style={styles.entryDates}>
                          {edu.startDate} - {edu.endDate || "Present"}
                        </Text>
                      </View>
                      <Text style={styles.eduInstitution}>{edu.institution}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Bottom Left Quill Decoration */}
              <View style={{ marginTop: "auto", paddingTop: 8 }}>
                <Image src={wizardingScrollIcons.quillInkpot} style={styles.quillImg} />
              </View>
            </View>

            {/* Right Column: Magical Skills, Projects, Honours */}
            <View style={styles.columnRight}>
              {/* Skills */}
              {skills.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitleText}>
                      {language === "de" ? "MAGISCHE FÄHIGKEITEN" : "MAGICAL SKILLS & SPELLS"}
                    </Text>
                  </View>

                  <View style={styles.skillsWrap}>
                    {skills.map((skill, idx) => (
                      <View key={idx} style={styles.skillPill}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitleText}>
                      {language === "de" ? "PROJEKTE & QUESTE" : "COMPLETED QUESTS & PROJECTS"}
                    </Text>
                  </View>

                  {projects.map((proj, idx) => (
                    <View key={idx} style={styles.projectContainer}>
                      <Text style={styles.projectName}>* {proj.name}</Text>
                      {proj.description ? (
                        <Text style={styles.projectDesc}>{proj.description}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}

              {/* Achievements */}
              {achievements.length > 0 && (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitleText}>
                      {language === "de" ? "AUSZEICHNUNGEN" : "HONOURS & ACHIEVEMENTS"}
                    </Text>
                  </View>

                  {achievements.map((ach, idx) => (
                    <View key={idx} style={styles.achievementRow}>
                      <Image src={wizardingScrollIcons.waxSeal} style={styles.waxSealImg} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.achievementTitle}>{ach.title}</Text>
                        {ach.description ? (
                          <Text style={styles.achievementDesc}>{ach.description}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Bottom Right Magic Wand Decoration */}
              <View style={{ marginTop: "auto", paddingTop: 8, alignItems: "flex-end" }}>
                <Image src={wizardingScrollIcons.wand} style={styles.wandImg} />
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
