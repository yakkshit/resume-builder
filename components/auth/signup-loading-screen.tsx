"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignupLoadingScreenProps {
  userName?: string;
  userEmail?: string;
  onComplete: () => void;
}

const PHASES = [
  { label: "Creating Secure Workspace...", progress: 25 },
  { label: "Provisioning Zero-Knowledge Memory Vault...", progress: 50 },
  { label: "Calibrating ATS Resume & Multi-Model Engine...", progress: 75 },
  { label: "Finalizing Career Intelligence Studio...", progress: 95 },
  { label: "Workspace Ready!", progress: 100 },
];

export function SignupLoadingScreen({
  userName,
  userEmail,
  onComplete,
}: SignupLoadingScreenProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Particle Sphere Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Generate 3D sphere points
    const POINT_COUNT = 360;
    const points: { x: number; y: number; z: number; baseAngle: number; speed: number; seed: number }[] = [];

    for (let i = 0; i < POINT_COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 85 + (Math.random() - 0.5) * 16;
      points.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        baseAngle: theta,
        speed: (Math.random() * 0.008 + 0.006) * (Math.random() > 0.5 ? 1 : -1),
        seed: Math.random() * Math.PI,
      });
    }

    let angleX = 0;
    let angleY = 0;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      angleX += 0.012;
      angleY += 0.018;

      const cx = size / 2;
      const cy = size / 2;

      // Draw subtle glow in center
      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
      gradient.addColorStop(0, "rgba(175, 243, 62, 0.16)");
      gradient.addColorStop(0.5, "rgba(175, 243, 62, 0.05)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      points.forEach((pt) => {
        // Rotate in 3D space
        const cosY = Math.cos(angleY + pt.seed);
        const sinY = Math.sin(angleY + pt.seed);
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);

        // Y-axis rotation
        const x1 = pt.x * cosY - pt.z * sinY;
        const z1 = pt.z * cosY + pt.x * sinY;

        // X-axis rotation
        const y1 = pt.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + pt.y * sinX;

        // Perspective projection
        const fov = 260;
        const scale = fov / (fov + z2);
        const px = cx + x1 * scale;
        const py = cy + y1 * scale;

        // Depth alpha and size
        const alpha = Math.max(0.15, Math.min(0.95, (z2 + 100) / 200));
        const dotSize = Math.max(1.2, 2.4 * scale);

        // Neon theme color palette
        ctx.fillStyle = `rgba(175, 243, 62, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Phased progression through initialization
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => {
        setPhaseIndex(1);
        setProgress(50);
      }, 700)
    );

    timers.push(
      setTimeout(() => {
        setPhaseIndex(2);
        setProgress(75);
      }, 1500)
    );

    timers.push(
      setTimeout(() => {
        setPhaseIndex(3);
        setProgress(95);
      }, 2300)
    );

    timers.push(
      setTimeout(() => {
        setPhaseIndex(4);
        setProgress(100);
        setIsFinished(true);
      }, 3100)
    );

    // Automatically transition to next screen after completion
    timers.push(
      setTimeout(() => {
        onComplete();
      }, 3800)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  const currentPhase = PHASES[phaseIndex] || PHASES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070709] text-white p-4 select-none">
      {/* Background ambient radial aura */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(175,243,62,0.12),transparent_70%)]" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Glowing 3D Particle Canvas */}
        <div className="relative flex items-center justify-center">
          {/* Subtle outer pulsing ring */}
          <div className="absolute size-64 rounded-full border border-primary/20 animate-ping opacity-25" />
          <div className="absolute size-72 rounded-full border border-primary/10 animate-pulse" />

          {/* 3D Orb Canvas */}
          <canvas
            ref={canvasRef}
            className="w-[260px] h-[260px] relative z-10 drop-shadow-[0_0_35px_rgba(175,243,62,0.35)]"
          />

          {/* Center icon / indicator */}
          <div className="absolute z-20 flex items-center justify-center size-12 rounded-full bg-black/60 backdrop-blur-md border border-primary/40 shadow-lg">
            {isFinished ? (
              <CheckCircle2 className="size-6 text-primary animate-in zoom-in-75 duration-300" />
            ) : (
              <Sparkles className="size-5 text-primary animate-pulse" />
            )}
          </div>
        </div>

        {/* Phase Title & Dynamic Status */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-wide uppercase shadow-xs">
            <ShieldCheck className="size-3.5" />
            <span>{isFinished ? "Setup Complete" : "AI Workspace Provisioning"}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white transition-all">
            {currentPhase.label}
          </h2>

          {(userName || userEmail) && (
            <p className="text-xs text-neutral-400">
              Personalizing career studio for{" "}
              <span className="text-white font-medium">{userName || userEmail}</span>
            </p>
          )}
        </div>

        {/* Glowing Progress Bar */}
        <div className="w-full max-w-xs space-y-2">
          <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-primary/80 via-primary to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(175,243,62,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
            <span>Progress</span>
            <span className="text-primary font-semibold">{progress}%</span>
          </div>
        </div>

        {/* Completion Action */}
        {isFinished && (
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button
              onClick={onComplete}
              className="h-9 px-6 text-xs font-semibold bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(175,243,62,0.4)]"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
