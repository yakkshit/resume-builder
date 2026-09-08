"use client";

import { BookOpen, Clock, ExternalLink, Star } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { ChatArtifactWindow } from "@/components/chat/chat-artifact-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Resource {
  id: number;
  title: string;
  platform: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: string;
  rating: number;
}

const DEFAULT: Resource[] = [
  { id: 1, title: "Advanced React Patterns", platform: "Frontend Masters", duration: "4h", level: "Advanced", price: "Free", rating: 4.9 },
  { id: 2, title: "System Design for Engineers", platform: "Educative", duration: "8h", level: "Intermediate", price: "$49", rating: 4.8 },
  { id: 3, title: "TypeScript Deep Dive", platform: "Udemy", duration: "6h", level: "Intermediate", price: "Free", rating: 4.7 },
  { id: 4, title: "DSA Masterclass", platform: "Coursera", duration: "10h", level: "Beginner", price: "$39", rating: 4.6 },
];

const levelColor: Record<string, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Intermediate: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Advanced: "bg-purple-500/15 text-purple-600 border-purple-500/30",
};

export function LearningResources({ data }: { data?: unknown }) {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.resources)
      ? (data as any).resources
      : Array.isArray((data as any)?.courses)
        ? (data as any).courses
        : Array.isArray((data as any)?.items)
          ? (data as any).items
          : Array.isArray((data as any)?.data)
            ? (data as any).data
            : [];

  const resources: Resource[] =
    list.length > 0
      ? list.map((r: any, idx: number): Resource => ({
          id: typeof r?.id === "number" ? r.id : idx + 1,
          title: typeof r?.title === "string" ? r.title : typeof r?.name === "string" ? r.name : `Course ${idx + 1}`,
          platform: typeof r?.platform === "string" ? r.platform : "Online",
          duration: typeof r?.duration === "string" ? r.duration : "Self-paced",
          level: r?.level === "Beginner" || r?.level === "Intermediate" || r?.level === "Advanced" ? r.level : "Intermediate",
          price: typeof r?.price === "string" ? r.price : "Free",
          rating: typeof r?.rating === "number" ? r.rating : 4.8,
        }))
      : DEFAULT;

  return (
    <ChatArtifactWindow
      variant="light"
      cardClassName="w-full border-border/60 shadow-sm"
      headerClassName="border-b border-border/50 pb-3 !flex-row !items-center"
      contentClassName="space-y-3 pt-4"
      title={
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="w-4 h-4 text-blue-500" />
          Recommended Learning
        </CardTitle>
      }
    >
        {resources.map((r) => (
          <div
            key={r.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium group-hover:text-blue-500 transition-colors truncate">{r.title}</p>
                <Badge className={`text-[10px] border flex-shrink-0 ${levelColor[r.level]}`}>{r.level}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{r.platform}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {r.duration}</span>
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {r.rating}</span>
                  <span className={r.price === "Free" ? "text-emerald-600 font-semibold" : "font-medium"}>{r.price}</span>
                </div>
                <Button size="sm" className="h-6 text-[10px] px-2 bg-blue-500 hover:bg-blue-600">
                  Start <ExternalLink className="w-2.5 h-2.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
    </ChatArtifactWindow>
  );
}
