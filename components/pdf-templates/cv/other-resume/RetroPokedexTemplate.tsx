import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { retroPokedexIcons } from "@/components/logos/resume_logos"
import { getResumeSectionTitles } from "@/lib/resume-section-titles"

/**
 * Retro Pokédex Pixel-Art Resume Template
 * Replicates the classic handheld Pokédex / GameBoy console:
 * - Steel handheld hardware bezel with top LED status lights & bottom D-pad
 * - Digital LCD panels ("DATA LOG", "STATUS & QUESTS")
 * - 8-bit RPG styled badges: TM move skills, pixel quest chest, pixel trophy
 */
const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: "Courier",
    fontSize: 7.8,
    color: "#E2E8F0",
    backgroundColor: "#334155",
    lineHeight: 1.25,
  },
  consoleBody: {
    backgroundColor: "#64748B",
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#1E293B",
    padding: 12,
    flex: 1,
  },
  // Top Header Cartridge Bar
  cartridgeBar: {
    backgroundColor: "#1E293B",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#0F172A",
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cartridgeTitle: {
    fontSize: 10.5,
    fontFamily: "Courier-Bold",
    color: "#38BDF8",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  ledGroup: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  ledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Trainer Header Bar
  trainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    padding: 6,
    marginBottom: 8,
    gap: 8,
  },
  pixelAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitials: {
    fontSize: 14,
    fontFamily: "Courier-Bold",
    color: "#38BDF8",
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    fontSize: 10.5,
    fontFamily: "Courier-Bold",
    color: "#38BDF8",
    letterSpacing: 0.5,
  },
  trainerRole: {
    fontSize: 7.2,
    fontFamily: "Courier-Bold",
    color: "#E2E8F0",
    marginTop: 1,
  },
  contactRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  contactText: {
    fontSize: 6.8,
    color: "#94A3B8",
  },

  // Main Screen Two-Panel Split
  screenSplit: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  lcdPanel: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#475569",
    padding: 8,
  },
  panelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingBottom: 3,
    marginBottom: 5,
  },
  panelTitle: {
    fontSize: 9,
    fontFamily: "Courier-Bold",
    color: "#38BDF8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionSubheading: {
    fontSize: 7.8,
    fontFamily: "Courier-Bold",
    color: "#FACC15",
    marginTop: 4,
    marginBottom: 3,
  },
  bodyText: {
    fontSize: 6.8,
    color: "#E2E8F0",
    lineHeight: 1.25,
  },

  // Items
  entryItem: {
    marginBottom: 5,
  },
  entryTitle: {
    fontSize: 7.4,
    fontFamily: "Courier-Bold",
    color: "#F8FAFC",
  },
  entrySub: {
    fontSize: 6.8,
    color: "#38BDF8",
  },
  entryDate: {
    fontSize: 6.5,
    color: "#94A3B8",
  },

  // TM Skill Badges
  tmGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 2,
    marginBottom: 4,
  },
  tmBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 4,
  },
  tmPrefix: {
    fontSize: 6,
    fontFamily: "Courier-Bold",
    color: "#F59E0B",
    marginRight: 2,
  },
  tmName: {
    fontSize: 6.5,
    fontFamily: "Courier-Bold",
    color: "#F8FAFC",
  },

  // Trophy Banner
  trophyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#FACC15",
    borderRadius: 6,
    padding: 4,
    marginTop: 3,
  },
  trophyText: {
    fontSize: 7,
    fontFamily: "Courier-Bold",
    color: "#FACC15",
  },

  // Bottom Console Hardware Controls
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  dPadImg: {
    width: 28,
    height: 28,
  },
  hardwareBtnGroup: {
    flexDirection: "row",
    gap: 8,
  },
  hardwareBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
});

interface RetroPokedexTemplateProps {
  resumeData: ResumeData;
  language?: string;
}

export function RetroPokedexTemplate({
  resumeData,
  language = "en",
}: RetroPokedexTemplateProps) {
  const titles = getResumeSectionTitles(language || resumeData.language || "en");
  const basicInfo = resumeData.basicInfo || ({} as any);
  const experience = resumeData.experience || [];
  const education = resumeData.education || [];
  const skills = resumeData.skills || [];
  const projects = resumeData.projects || [];
  const achievements = resumeData.achievements || [];

  return (
    <Document title={`${basicInfo.name || "Trainer"} - Pokedex Data Log`} author="Silph Co.">
      <Page size="A4" style={styles.page}>
        <View style={styles.consoleBody}>
          {/* Top Cartridge Header */}
          <View style={styles.cartridgeBar}>
            <Image src={retroPokedexIcons.pixelPokeball} style={{ width: 14, height: 14 }} />
            <Text style={styles.cartridgeTitle}>POKÉDEX DATA LOG</Text>
            <View style={styles.ledGroup}>
              <View style={[styles.ledDot, { backgroundColor: "#38BDF8" }]} />
              <View style={[styles.ledDot, { backgroundColor: "#22C55E" }]} />
              <View style={[styles.ledDot, { backgroundColor: "#FACC15" }]} />
              <View style={[styles.ledDot, { backgroundColor: "#EF4444" }]} />
            </View>
          </View>

          {/* Trainer Info Header Bar */}
          <View style={styles.trainerHeader}>
            <View style={styles.pixelAvatarBox}>
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
                    : "PK"}
                </Text>
              )}
            </View>
            <View style={styles.trainerInfo}>
              <Text style={styles.trainerName}>{basicInfo.name || "Venkata Sai Yakkshit Reddy Asodi"}</Text>
              <Text style={styles.trainerRole}>
                {basicInfo.title || "FULL-STACK ENGINEER (WEB & DATA APPLICATIONS)"}
              </Text>
              <View style={styles.contactRow}>
                {basicInfo.email ? <Text style={styles.contactText}>MSG: {basicInfo.email}</Text> : null}
                {basicInfo.location ? <Text style={styles.contactText}>LOC: {basicInfo.location}</Text> : null}
              </View>
            </View>
          </View>

          {/* Dual LCD Panels */}
          <View style={styles.screenSplit}>
            {/* Left LCD Panel: DATA LOG (Summary + Experience) */}
            <View style={styles.lcdPanel}>
              <View style={styles.panelTitleRow}>
                <Text style={styles.panelTitle}>[ DATA LOG ]</Text>
              </View>

              {/* Summary */}
              {basicInfo.summary ? (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.sectionSubheading}>▶ SUMMARY</Text>
                  <Text style={styles.bodyText}>{basicInfo.summary}</Text>
                </View>
              ) : null}

              {/* Experience */}
              {experience.length > 0 && (
                <View>
                  <Text style={styles.sectionSubheading}>▶ EXPERIENCE</Text>
                  {experience.map((exp, idx) => (
                    <View key={idx} style={styles.entryItem}>
                      <Text style={styles.entryTitle}>• {exp.position}</Text>
                      <Text style={styles.entryDate}>
                        {exp.startDate} - {exp.endDate || "Present"} | {exp.company}
                      </Text>
                      {exp.description ? (
                        <Text style={styles.bodyText}>{exp.description}</Text>
                      ) : null}
                      {exp.highlights?.map((h, hIdx) => (
                        <Text key={hIdx} style={[styles.bodyText, { marginLeft: 6 }]}>
                          - {h}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Right LCD Panel: STATUS & QUESTS */}
            <View style={styles.lcdPanel}>
              <View style={styles.panelTitleRow}>
                <Text style={styles.panelTitle}>[ STATUS & QUESTS ]</Text>
              </View>

              {/* Moves & Skills */}
              {skills.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.sectionSubheading}>★ MOVES & SKILLS</Text>
                  <View style={styles.tmGrid}>
                    {skills.map((skill, idx) => (
                      <View key={idx} style={styles.tmBadge}>
                        <Text style={styles.tmPrefix}>TM</Text>
                        <Text style={styles.tmName}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Education */}
              {education.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.sectionSubheading}>◆ ACADEMIC TRAINING</Text>
                  {education.map((edu, idx) => (
                    <View key={idx} style={styles.entryItem}>
                      <Text style={styles.entryTitle}>• {edu.degree}</Text>
                      <Text style={styles.entrySub}>{edu.institution}</Text>
                      <Text style={styles.entryDate}>
                        {edu.startDate} - {edu.endDate}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text style={styles.sectionSubheading}>⚑ ACTIVE QUESTS</Text>
                  {projects.map((proj, idx) => (
                    <View key={idx} style={styles.entryItem}>
                      <Text style={styles.entryTitle}>• {proj.name}</Text>
                      {proj.description ? (
                        <Text style={styles.bodyText}>{proj.description}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}

              {/* Achievements */}
              {achievements.length > 0 && (
                <View>
                  <Text style={styles.sectionSubheading}>♛ BADGES & HONORS</Text>
                  {achievements.map((ach, idx) => (
                    <View key={idx} style={styles.trophyBox}>
                      <Image src={retroPokedexIcons.pixelTrophy} style={{ width: 12, height: 12 }} />
                      <Text style={styles.trophyText}>
                        {ach.title} {ach.date ? `[${ach.date}]` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Bottom Console Controls */}
          <View style={styles.bottomControls}>
            <Image src={retroPokedexIcons.dPad} style={styles.dPadImg} />
            <View style={styles.hardwareBtnGroup}>
              <View style={styles.hardwareBtn} />
              <View style={[styles.hardwareBtn, { backgroundColor: "#3B82F6", borderColor: "#1E3A8A" }]} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
