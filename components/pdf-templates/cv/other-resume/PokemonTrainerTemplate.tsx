import React from "react"
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { ResumeData } from "@/lib/types"
import { pokemonTrainerIcons } from "@/components/logos/resume_logos"
import { getResumeSectionTitles } from "@/lib/resume-section-titles"

/**
 * Pokémon Trainer Resume Template
 * Faithfully replicates the anime trainer card layout from Image 2:
 * - 4 Corner Pokéballs with bold outline
 * - Red corner wedges and blue side-racing stripes
 * - Cartoon "★ TRAINER RESUME ★" title banner
 * - Blue capsule badges with yellow text and sub-labels
 * - Elemental badges, gym badges, and quest swords
 * - Colorful skill chips and zero text overlaps
 */
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 7.8,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.3,
  },
  cardContainer: {
    position: "relative",
    borderWidth: 3.5,
    borderColor: "#1E293B",
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // 4 Corner Pokéballs
  cornerBallTL: {
    position: "absolute",
    top: -14,
    left: -14,
    width: 28,
    height: 28,
    zIndex: 10,
  },
  cornerBallTR: {
    position: "absolute",
    top: -14,
    right: -14,
    width: 28,
    height: 28,
    zIndex: 10,
  },
  cornerBallBL: {
    position: "absolute",
    bottom: -14,
    left: -14,
    width: 28,
    height: 28,
    zIndex: 10,
  },
  cornerBallBR: {
    position: "absolute",
    bottom: -14,
    right: -14,
    width: 28,
    height: 28,
    zIndex: 10,
  },

  // Red Corner Wedges (Top Left & Top Right)
  wedgeTL: {
    position: "absolute",
    top: 4,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#0F172A",
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 8,
  },
  wedgeTR: {
    position: "absolute",
    top: 4,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#0F172A",
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 8,
  },
  wedgeText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#FEF08A",
  },

  // Blue Side Racing Stripes
  sideBarL: {
    position: "absolute",
    left: 3,
    top: 45,
    bottom: 45,
    width: 5,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "#0F172A",
    borderRadius: 2,
  },
  sideBarR: {
    position: "absolute",
    right: 3,
    top: 45,
    bottom: 45,
    width: 5,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "#0F172A",
    borderRadius: 2,
  },

  // Main Header Banner
  titleBanner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 8,
    gap: 8,
  },
  headerStar: {
    width: 14,
    height: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#EAB308",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },

  // Profile Header Row
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: "#E2E8F0",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: "#2563EB",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitials: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1E40AF",
  },
  profileDetails: {
    flex: 1,
  },
  candidateName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  candidateTitle: {
    fontSize: 8.2,
    fontFamily: "Helvetica-Bold",
    color: "#1E3A8A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 3,
  },
  contactItem: {
    fontSize: 7,
    fontFamily: "Helvetica",
    color: "#475569",
  },

  // Section Header Bars
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    marginBottom: 4,
  },
  pokeballMini: {
    width: 13,
    height: 13,
  },
  bluePillBadge: {
    backgroundColor: "#1D4ED8",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#0F172A",
    paddingVertical: 2.5,
    paddingHorizontal: 9,
  },
  bluePillText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#FACC15",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionSubLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginLeft: 3,
  },
  headerRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  questPillBadge: {
    backgroundColor: "#2563EB",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#0F172A",
    paddingVertical: 1.5,
    paddingHorizontal: 6,
  },
  questPillText: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    color: "#FEF08A",
  },
  swordIcon: {
    width: 11,
    height: 11,
  },
  elementIcon: {
    width: 11,
    height: 11,
  },

  // Summary Container
  summaryBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 6,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 7.4,
    lineHeight: 1.35,
    color: "#1E293B",
  },

  // Experience Entries
  entryContainer: {
    marginBottom: 4,
  },
  entryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 1,
  },
  entryRole: {
    fontSize: 8.2,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    flex: 1,
    paddingRight: 8,
  },
  entryCompany: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Bold",
    color: "#1D4ED8",
    textAlign: "right",
  },
  entryDescription: {
    fontSize: 7.2,
    lineHeight: 1.3,
    color: "#334155",
    marginTop: 1,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 1.5,
  },
  bulletDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#1D4ED8",
    marginTop: 3.5,
    marginRight: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 7.1,
    lineHeight: 1.3,
    color: "#334155",
  },

  // Skills Chips
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
    marginBottom: 4,
  },
  skillChip: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  skillChipText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },

  // Education Item
  eduRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 1,
    marginBottom: 1,
  },
  eduDegree: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    flex: 1,
  },
  eduDates: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#64748B",
    textAlign: "right",
  },
  eduInstitution: {
    fontSize: 7.2,
    fontFamily: "Helvetica",
    color: "#475569",
    marginBottom: 3,
  },

  // Project Item
  projectItem: {
    marginBottom: 3,
  },
  projectName: {
    fontSize: 7.8,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  projectDesc: {
    fontSize: 7.1,
    lineHeight: 1.3,
    color: "#334155",
    marginTop: 1,
  },

  // Achievement Row
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  trophyIcon: {
    width: 14,
    height: 14,
  },
  achievementText: {
    fontSize: 7.6,
    fontFamily: "Helvetica-Bold",
    color: "#92400E",
  },
});

const POKEMON_SKILL_COLORS = [
  "#2563EB", // TypeScript Blue
  "#D97706", // JavaScript Amber
  "#16A34A", // Python Green
  "#0D9488", // C++ Teal
  "#DC2626", // SQL Red
  "#059669", // Node Emerald
  "#7C3AED", // Flutter Purple
  "#0284C7", // React Cyan
  "#4F46E5", // Docker Indigo
  "#DB2777", // Kubernetes Pink
  "#EA580C", // CI/CD Orange
  "#6366F1", // Dragon Indigo
];

interface PokemonTrainerTemplateProps {
  resumeData: ResumeData;
  language?: string;
}

export function PokemonTrainerTemplate({
  resumeData,
  language = "en",
}: PokemonTrainerTemplateProps) {
  const titles = getResumeSectionTitles(language || resumeData.language || "en");
  const basicInfo = resumeData.basicInfo || ({} as any);
  const experience = resumeData.experience || [];
  const education = resumeData.education || [];
  const skills = resumeData.skills || [];
  const projects = resumeData.projects || [];
  const achievements = resumeData.achievements || [];

  return (
    <Document title={`${basicInfo.name || "Trainer"} - Trainer Resume`} author="Pokemon League">
      <Page size="A4" style={styles.page}>
        <View style={styles.cardContainer}>
          {/* 4 Corner Pokéballs */}
          <Image src={pokemonTrainerIcons.cornerPokeball} style={styles.cornerBallTL} />
          <Image src={pokemonTrainerIcons.cornerPokeball} style={styles.cornerBallTR} />
          <Image src={pokemonTrainerIcons.cornerPokeball} style={styles.cornerBallBL} />
          <Image src={pokemonTrainerIcons.cornerPokeball} style={styles.cornerBallBR} />

          {/* Red Corner Wedge Accents */}
          <View style={styles.wedgeTL}>
            <Text style={styles.wedgeText}>★ PKMN-ID</Text>
          </View>
          <View style={styles.wedgeTR}>
            <Text style={styles.wedgeText}>GEN-IX ★</Text>
          </View>

          {/* Blue Side Racing Stripes */}
          <View style={styles.sideBarL} />
          <View style={styles.sideBarR} />

          {/* Top Title Banner */}
          <View style={styles.titleBanner}>
            <Image src={pokemonTrainerIcons.starSparkle} style={styles.headerStar} />
            <Text style={styles.headerTitle}>TRAINER RESUME</Text>
            <Image src={pokemonTrainerIcons.starSparkle} style={styles.headerStar} />
          </View>

          {/* Profile Row */}
          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
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
            <View style={styles.profileDetails}>
              <Text style={styles.candidateName}>
                {basicInfo.name || "Venkata Sai Yakkshit Reddy Asodi"}
              </Text>
              <Text style={styles.candidateTitle}>
                {basicInfo.title || "FULL-STACK ENGINEER (WEB & DATA APPLICATIONS)"}
              </Text>
              <View style={styles.contactRow}>
                {basicInfo.email ? (
                  <Text style={styles.contactItem}>EMAIL: {basicInfo.email}</Text>
                ) : null}
                {basicInfo.phone ? (
                  <Text style={styles.contactItem}>TEL: {basicInfo.phone}</Text>
                ) : null}
                {basicInfo.location ? (
                  <Text style={styles.contactItem}>LOC: {basicInfo.location}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* SUMMARY */}
          {basicInfo.summary ? (
            <View>
              <View style={styles.sectionHeader}>
                <View style={styles.bluePillBadge}>
                  <Text style={styles.bluePillText}>{titles.summary || "SUMMARY"}</Text>
                </View>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>{basicInfo.summary}</Text>
              </View>
            </View>
          ) : null}

          {/* EXPERIENCE */}
          {experience.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Image src={pokemonTrainerIcons.pokeball} style={styles.pokeballMini} />
                <View style={styles.bluePillBadge}>
                  <Text style={styles.bluePillText}>{titles.experience || "EXPERIENCE"}</Text>
                </View>
                <Text style={styles.sectionSubLabel}>Gym Badge</Text>
                <View style={styles.headerRightGroup}>
                  <Image src={pokemonTrainerIcons.questSwords} style={styles.swordIcon} />
                  <View style={styles.questPillBadge}>
                    <Text style={styles.questPillText}>QUEST</Text>
                  </View>
                  <Image src={pokemonTrainerIcons.pokeball} style={styles.elementIcon} />
                  <Image src={pokemonTrainerIcons.gymBadge} style={styles.elementIcon} />
                </View>
              </View>

              {experience.map((exp, idx) => (
                <View key={idx} style={styles.entryContainer}>
                  <View style={styles.entryHeaderRow}>
                    <Text style={styles.entryRole}>
                      • {exp.position} ({exp.startDate} - {exp.endDate || "Present"})
                    </Text>
                    <Text style={styles.entryCompany}>{exp.company}</Text>
                  </View>
                  {exp.description ? (
                    <Text style={styles.entryDescription}>{exp.description}</Text>
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

          {/* SKILLS */}
          {skills.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Image src={pokemonTrainerIcons.pokeball} style={styles.pokeballMini} />
                <View style={styles.bluePillBadge}>
                  <Text style={styles.bluePillText}>{titles.skills || "SKILLS"}</Text>
                </View>
                <Text style={styles.sectionSubLabel}>Trainer Abilities</Text>
                <View style={styles.headerRightGroup}>
                  <Image src={pokemonTrainerIcons.elementFire} style={styles.elementIcon} />
                  <Image src={pokemonTrainerIcons.elementWater} style={styles.elementIcon} />
                  <Image src={pokemonTrainerIcons.elementGrass} style={styles.elementIcon} />
                  <Image src={pokemonTrainerIcons.elementElectric} style={styles.elementIcon} />
                </View>
              </View>

              <View style={styles.skillsWrap}>
                {skills.map((skill, idx) => {
                  const color = POKEMON_SKILL_COLORS[idx % POKEMON_SKILL_COLORS.length];
                  return (
                    <View key={idx} style={styles.skillChip}>
                      <Text style={[styles.skillChipText, { color }]}>{skill}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* EDUCATION */}
          {education.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Image src={pokemonTrainerIcons.pokeball} style={styles.pokeballMini} />
                <View style={styles.bluePillBadge}>
                  <Text style={styles.bluePillText}>{titles.education || "EDUCATION"}</Text>
                </View>
                <Text style={styles.sectionSubLabel}>Academy Training</Text>
                <View style={styles.headerRightGroup}>
                  <Image src={pokemonTrainerIcons.pokeball} style={styles.elementIcon} />
                  <Text style={styles.sectionSubLabel}>League Certified</Text>
                </View>
              </View>

              {education.map((edu, idx) => (
                <View key={idx}>
                  <View style={styles.eduRow}>
                    <Text style={styles.eduDegree}>• {edu.degree}</Text>
                    <Text style={styles.eduDates}>
                      {edu.startDate} - {edu.endDate || "Present"}
                    </Text>
                  </View>
                  <Text style={styles.eduInstitution}>{edu.institution}</Text>
                </View>
              ))}
            </View>
          )}

          {/* PROJECTS */}
          {projects.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Image src={pokemonTrainerIcons.pokeball} style={styles.pokeballMini} />
                <View style={styles.bluePillBadge}>
                  <Text style={styles.bluePillText}>{titles.projects || "PROJECTS"}</Text>
                </View>
                <View style={styles.headerRightGroup}>
                  <Image src={pokemonTrainerIcons.questSwords} style={styles.swordIcon} />
                  <Text style={styles.sectionSubLabel}>Special Quests</Text>
                </View>
              </View>

              {projects.map((proj, idx) => (
                <View key={idx} style={styles.projectItem}>
                  <Text style={styles.projectName}>• {proj.name}</Text>
                  {proj.description ? (
                    <Text style={styles.projectDesc}>{proj.description}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* ACHIEVEMENTS */}
          {achievements.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Image src={pokemonTrainerIcons.pokeball} style={styles.pokeballMini} />
                <View style={styles.bluePillBadge}>
                  <Text style={styles.bluePillText}>{titles.achievements || "ACHIEVEMENTS"}</Text>
                </View>
              </View>

              {achievements.map((ach, idx) => (
                <View key={idx} style={styles.achievementRow}>
                  <Image src={pokemonTrainerIcons.trophy} style={styles.trophyIcon} />
                  <Text style={styles.achievementText}>
                    {ach.title} {ach.description ? `- ${ach.description}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
