"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Gauge,
  Activity,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Terminal,
  Cpu,
  Lock,
  Unlock,
  Eye,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Radio,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Digital Predictability & Stealer Threat Questions
// ─────────────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  title: string;
  description: string;
  options: {
    label: string;
    description: string;
    predictabilityScore: number; // 0 to 100
    stealerRisk: "low" | "medium" | "critical";
  }[];
}

const PREDICTABILITY_QUESTIONS: Question[] = [
  {
    id: "schedule",
    title: "1. Daily Schedule & Device Routine",
    description: "Infostealers monitor idle times and predictable logon windows to exfiltrate data undetected.",
    options: [
      {
        label: "Strict fixed routine",
        description: "Same laptop, fixed 9-5 hours, same desk, same Wi-Fi every day.",
        predictabilityScore: 90,
        stealerRisk: "critical",
      },
      {
        label: "Semi-structured routine",
        description: "Hybrid schedule, occasional cafe work, moderate variations.",
        predictabilityScore: 50,
        stealerRisk: "medium",
      },
      {
        label: "Dynamic / high entropy",
        description: "Variable hours, frequent device rotations, randomized timing.",
        predictabilityScore: 15,
        stealerRisk: "low",
      },
    ],
  },
  {
    id: "sessions",
    title: "2. Browser Session & Cookie Hygiene",
    description: "Modern stealers (RedLine, Lumma) do not crack passwords—they grab decrypted session cookies.",
    options: [
      {
        label: "Always logged into everything",
        description: "Never log out, 50+ tabs open, passwords saved in browser auto-fill.",
        predictabilityScore: 95,
        stealerRisk: "critical",
      },
      {
        label: "Occasional cleanup",
        description: "Browser password manager with master password or biometrics.",
        predictabilityScore: 55,
        stealerRisk: "medium",
      },
      {
        label: "Ephemeral containers / Passkeys",
        description: "Auto-clearing session cookies, external vault (Bitwarden), hardware Passkeys.",
        predictabilityScore: 10,
        stealerRisk: "low",
      },
    ],
  },
  {
    id: "digital_footprint",
    title: "3. Digital Footprint & Location Exhaust",
    description: "Public check-ins, Strava runs, and real-time social posts allow adversaries to map physical availability.",
    options: [
      {
        label: "Real-time updates & public feeds",
        description: "Live Instagram/X stories, public Strava routes, live status updates.",
        predictabilityScore: 85,
        stealerRisk: "critical",
      },
      {
        label: "Delayed sharing",
        description: "Posts shared hours or days later, private accounts for fitness trackers.",
        predictabilityScore: 40,
        stealerRisk: "medium",
      },
      {
        label: "Ghost mode / Obfuscated trace",
        description: "Zero real-time location tags, privacy zones on fitness routes, anonymous handles.",
        predictabilityScore: 12,
        stealerRisk: "low",
      },
    ],
  },
  {
    id: "network",
    title: "4. Network & Connection Habits",
    description: "Automated WiFi probing matches MAC addresses and SSID probe requests to predict destinations.",
    options: [
      {
        label: "Auto-connect to known / open Wi-Fi",
        description: "Phone and laptop auto-join coffee shop and airport SSIDs without VPN.",
        predictabilityScore: 90,
        stealerRisk: "critical",
      },
      {
        label: "Manual Wi-Fi with occasional VPN",
        description: "Turn off auto-join, connect manually, use VPN for sensitive logins.",
        predictabilityScore: 45,
        stealerRisk: "medium",
      },
      {
        label: "Always-on WireGuard / Cellular hotspot",
        description: "Encrypted DNS (DoH), randomized MAC address, zero public Wi-Fi trust.",
        predictabilityScore: 15,
        stealerRisk: "low",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Racing Telemetry & Life Performance Suggestions
// ─────────────────────────────────────────────────────────────────────────────

interface RacingPillar {
  title: string;
  badge: string;
  focusArea: string;
  description: string;
  actionableDrills: string[];
  telemetryMetric: string;
  expectedGain: string;
}

const RACING_IMPROVEMENTS: RacingPillar[] = [
  {
    title: "Trail-Braking & Weight Transfer Management",
    badge: "Dynamics",
    focusArea: "Entry Phase to Apex",
    description:
      "Most drivers release the brake pedal abruptly before turning in, unweighting the front axle and causing mid-corner understeer. Smoothly trailing off pressure as steering lock increases maintains tire contact patch grip.",
    actionableDrills: [
      "Practice 100% threshold braking in straight line, slowly tapering to 15% as steering angle reaches 45°.",
      "Monitor throttle-to-brake pedal overlap; zero coasting time between release and pickup.",
      "Log longitudinal vs lateral G-force on the friction circle (g-g diagram) to ensure smooth transitions.",
    ],
    telemetryMetric: "Longitudinal G decay slope ≤ -0.25 g/sec",
    expectedGain: "-0.3s to -0.6s per technical corner",
  },
  {
    title: "Vision Horizon & Cognitive Reaction Latency",
    badge: "Cognitive",
    focusArea: "Driver Perception & Visual Scanning",
    description:
      "At 160+ km/h, looking directly in front of the front wing or bumper induces visual tunnel-vision and panic inputs. Scanning 3 corners ahead calms sensory input and allows your autonomic nervous system to execute reflexes subconsciously.",
    actionableDrills: [
      "Fixate on exit kerb while braking for turn-in; never look at the apex once the car is committed.",
      "Pre-session reaction drills (Fitlight / strobe glasses) to reduce motor response latency below 180ms.",
      "Sync telemetry with in-car camera pupil tracking to detect gaze fixation errors.",
    ],
    telemetryMetric: "Gaze horizon delta ≥ 45m ahead",
    expectedGain: "+12% corner exit commitment confidence",
  },
  {
    title: "Physical G-Load Endurance & Biometric HRV Sync",
    badge: "Physiology",
    focusArea: "Stamina & Lateral G Fatigue",
    description:
      "Under sustained 1.5G - 2.0G lateral loads, heart rate hits 160-180 BPM. As lactic acid accumulates, driver precision degrades by up to 25% after lap 8, leading to missed braking markers.",
    actionableDrills: [
      "Isometric neck harness training (4-way resistance bands) to resist helmet g-force strain.",
      "Zone-2 steady cardio (cycling/rowing) 3x weekly to keep baseline racing HR below anaerobic threshold.",
      "Track pre-race Heart Rate Variability (HRV) with Whoop/Oura; adjust tire aggression if CNS is fatigued.",
    ],
    telemetryMetric: "Sustained heart rate variability (rMSSD) > 65ms",
    expectedGain: "Zero lap-time drop-off over 25-lap stint",
  },
  {
    title: "ROS2 & CAN-Bus Telemetry Data Ingestion",
    badge: "Telemetry / ROS2",
    focusArea: "Autonomous & Driver Ingestion Stack",
    description:
      "Bridge your Bodensee Racing Team autonomous robotics stack with driver telemetry. Replay ROS2 bag files and CAN-bus logs to compare human throttle trace against the mathematical optimal velocity profile.",
    actionableDrills: [
      "Ingest `.bag` or CAN CSV into ApexTelemetry CLI to generate heatmapped delta overlays.",
      "Identify the exact meter where tire slip ratio exceeds optimal 8-12% traction peak.",
      "Use simulation (Assetto Corsa / Gazebo) with real steering torque feedback matching your chassis setup.",
    ],
    telemetryMetric: "Tire slip angle target: 6° - 8° peak slip",
    expectedGain: "Pinpoint telemetry-driven engineering changes",
  },
];

export function PredictabilityRacingLab() {
  const [activeTab, setActiveTab] = useState<"predictability" | "racing">("predictability");

  // Predictability Quiz State
  const [answers, setAnswers] = useState<Record<string, number>>({
    schedule: 0,
    sessions: 0,
    digital_footprint: 0,
    network: 0,
  });

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  // Compute Overall Predictability & Threat Score
  const totalScore = Math.round(
    Object.entries(answers).reduce((acc, [qId, optIdx]) => {
      const q = PREDICTABILITY_QUESTIONS.find((item) => item.id === qId);
      return acc + (q?.options[optIdx]?.predictabilityScore ?? 50);
    }, 0) / PREDICTABILITY_QUESTIONS.length
  );

  const getThreatLevel = (score: number) => {
    if (score >= 75) return { label: "High Predictability / Critical Threat Surface", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30", badge: "Critical Risk" };
    if (score >= 45) return { label: "Moderate Pattern Vulnerability", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", badge: "Medium Risk" };
    return { label: "High Entropy / Hardened Threat Surface", color: "text-[#aff33e]", bg: "bg-[#aff33e]/15 border-[#aff33e]/30", badge: "Well Hardened" };
  };

  const threat = getThreatLevel(totalScore);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 -z-10 h-64 w-64 rounded-full bg-[#aff33e]/5 blur-3xl pointer-events-none" />

      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="size-2 rounded-full bg-[#aff33e] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Interactive Open Source Simulator
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Pattern Predictability &amp; Racing OS
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-xl">
            Simulate how predictable your daily routines are against digital infostealers, or optimize your driving reflex and telemetry metrics.
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("predictability")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "predictability"
                ? "bg-white text-black shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="size-3.5" />
            <span>Stealer &amp; Routine Risk</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("racing")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "racing"
                ? "bg-[#aff33e] text-black shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Gauge className="size-3.5" />
            <span>Racing Life Optimizer</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: PREDICTABILITY & STEALER SIMULATOR ─────────────── */}
      {activeTab === "predictability" && (
        <div className="mt-6 space-y-8">
          {/* Top Score Summary Banner */}
          <div className={`p-5 rounded-xl border ${threat.bg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-white/20 text-[10px] font-mono text-zinc-300">
                  {threat.badge}
                </Badge>
                <span className={`text-sm font-bold ${threat.color}`}>{threat.label}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                Infostealers (RedLine, Lumma, MetaStealer) weaponize behavioral repetition. Lower your predictability score by introducing operational entropy and isolating decrypted cookie vaults.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0 bg-black/40 px-5 py-3 rounded-xl border border-white/10">
              <div className="text-right">
                <div className="text-xs font-mono text-zinc-400 uppercase">Predictability Index</div>
                <div className="text-2xl font-black font-mono text-white">{totalScore}%</div>
              </div>
              <div className="w-14">
                <Progress value={totalScore} className="h-2 bg-white/10" />
              </div>
            </div>
          </div>

          {/* Interactive Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PREDICTABILITY_QUESTIONS.map((q) => {
              const selectedIdx = answers[q.id] ?? 0;
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-white/10 bg-black/40 p-5 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center justify-between">
                      <span>{q.title}</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-snug">{q.description}</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {q.options.map((opt, idx) => {
                      const isSelected = selectedIdx === idx;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleSelectOption(q.id, idx)}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-start justify-between gap-3 ${
                            isSelected
                              ? "bg-white/10 border-white/30 text-white shadow-xs"
                              : "bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-300"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-semibold text-[12px] flex items-center gap-1.5">
                              <span className={`size-1.5 rounded-full ${isSelected ? "bg-[#aff33e]" : "bg-zinc-600"}`} />
                              <span>{opt.label}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-tight line-clamp-2">{opt.description}</p>
                          </div>
                          <span
                            className={`font-mono text-[10px] shrink-0 px-1.5 py-0.5 rounded ${
                              opt.stealerRisk === "critical"
                                ? "text-rose-400 bg-rose-500/10"
                                : opt.stealerRisk === "medium"
                                ? "text-amber-400 bg-amber-500/10"
                                : "text-emerald-400 bg-emerald-500/10"
                            }`}
                          >
                            {opt.predictabilityScore}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stealer Attack Vector Blueprint & Actionable Countermeasures */}
          <div className="rounded-xl border border-white/10 bg-black/60 p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="flex items-center gap-2 text-zinc-300">
                <Terminal className="size-4 text-[#aff33e]" />
                <span className="font-bold">Infostealer Exfiltration Simulation Vector</span>
              </span>
              <span className="text-[10px] text-zinc-500">Live Architecture Analysis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                <div className="text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Unlock className="size-3.5 text-rose-400" />
                  <span>Cookie Vault Harvest</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Stealers decrypt DPAPI tokens directly from Chrome `%LOCALAPPDATA%\User Data\Default\Network\Cookies`.
                </p>
                <div className="text-[10px] text-emerald-400 pt-1">&rarr; Counter: Ephemeral isolated profiles</div>
              </div>

              <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                <div className="text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Activity className="size-3.5 text-amber-400" />
                  <span>Routine Pattern Timing</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Spearphishing payloads timed precisely at 08:55 AM or 05:15 PM when cognitive guard is lowest.
                </p>
                <div className="text-[10px] text-emerald-400 pt-1">&rarr; Counter: Asynchronous batch verification</div>
              </div>

              <div className="space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                <div className="text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Eye className="size-3.5 text-[#aff33e]" />
                  <span>Digital OSINT Tracing</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Public sports telemetry and Wi-Fi SSID logs establish exact physical coordinates and travel routes.
                </p>
                <div className="text-[10px] text-emerald-400 pt-1">&rarr; Counter: Randomized MAC + delayed uploads</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: RACING LIFE OPTIMIZER ──────────────────────────── */}
      {activeTab === "racing" && (
        <div className="mt-6 space-y-6">
          <div className="p-4 rounded-xl border border-white/10 bg-[#aff33e]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#aff33e] text-black text-[10px] font-mono hover:bg-[#aff33e]">
                  Bodensee Racing Telemetry &bull; Driver Engineering
                </Badge>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Proven principles from Formula Student, ROS2 autonomous racing navigation, and high-G telemetry to drop lap times and extend cognitive stamina.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono text-zinc-500">Benchmark Target</span>
              <div className="text-xl font-bold font-mono text-[#aff33e]">-1.20s / Lap</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {RACING_IMPROVEMENTS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-xl border border-white/10 bg-black/40 p-5 space-y-4 hover:border-white/25 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-white/15 text-[10px] font-mono text-zinc-400">
                      {pillar.badge}
                    </Badge>
                    <span className="text-[10px] font-mono text-[#aff33e]">{pillar.expectedGain}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{pillar.title}</h3>
                  <div className="text-[11px] font-mono text-zinc-500 mt-0.5">Focus: {pillar.focusArea}</div>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">{pillar.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-zinc-300">Actionable Drills:</span>
                    <ul className="space-y-1 text-[11px] text-zinc-400">
                      {pillar.actionableDrills.map((drill, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-1.5">
                          <span className="text-[#aff33e] shrink-0 font-mono">&rsaquo;</span>
                          <span>{drill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white/[0.02] px-3 py-2 rounded-lg border border-white/5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Target Telemetry:</span>
                    <span className="text-zinc-200">{pillar.telemetryMetric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ROS2 Racing Stack Command Preview */}
          <div className="rounded-xl border border-white/10 bg-black p-4 font-mono text-xs text-zinc-300 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/5 pb-2">
              <span className="flex items-center gap-2">
                <Cpu className="size-3.5 text-[#aff33e]" />
                <span>ROS2 Autonomous &amp; Driver Telemetry Bridge (`apex_racing_stack`)</span>
              </span>
              <span className="text-[#aff33e]">100 Hz Real-Time Loop</span>
            </div>
            <div className="text-[11px] text-emerald-400">$ ros2 launch apex_telemetry driver_lap_analyzer.launch.py bag:=bodensee_quali_03.db3</div>
            <div className="text-[11px] text-zinc-400">&gt; Ingesting IMU (6-DOF) + Wheel Speed Encoders + GPS RTK (2cm precision)</div>
            <div className="text-[11px] text-zinc-400">&gt; Peak Lateral G: 1.84G at Turn 6 &bull; Driver Reaction Delta: 168ms (Optimum)</div>
            <div className="text-[11px] text-[#aff33e]">&gt; Suggested Braking Marker Adjustment: Move Turn 2 marker +4.2m deeper</div>
          </div>
        </div>
      )}
    </div>
  );
}

