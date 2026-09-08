"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#38bdf8", // Sky blue
  "#818cf8", // Indigo
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
];

export interface ChartViewerProps {
  data?: {
    type?: "bar" | "line" | "area" | "pie" | "radar";
    title?: string;
    description?: string;
    metrics?: string;
    xAxisKey?: string;
    yAxisKey?: string;
    dataKey?: string;
    categories?: string[];
    data?: Array<Record<string, any>>;
    items?: Array<Record<string, any>>;
  };
}

export function ChartViewer({ data }: ChartViewerProps) {
  const chartType = data?.type || "bar";
  const title = data?.title || "Data Analytics";
  const description = data?.description || "Visualized Career & Market Metrics";
  const chartData = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
      ? data.items
      : [];

  const xAxisKey = data?.xAxisKey || "name";
  const dataKey = data?.dataKey || "value";
  const categories = useMemo(() => {
    if (Array.isArray(data?.categories) && data.categories.length > 0) {
      return data.categories;
    }
    if (chartData.length > 0) {
      const keys = Object.keys(chartData[0]).filter(
        (k) => k !== xAxisKey && typeof chartData[0][k] === "number"
      );
      return keys.length > 0 ? keys : [dataKey];
    }
    return [dataKey];
  }, [data?.categories, chartData, xAxisKey, dataKey]);

  if (chartData.length === 0) {
    return (
      <Card className="border-border/60 bg-muted/10 backdrop-blur-sm">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            {title}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 text-center text-xs text-muted-foreground">
          No data available for visualization.
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey={xAxisKey} stroke="#888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {categories.map((cat, idx) => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stroke={PALETTE[idx % PALETTE.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: PALETTE[idx % PALETTE.length] }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                {categories.map((cat, idx) => (
                  <linearGradient key={cat} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE[idx % PALETTE.length]} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={PALETTE[idx % PALETTE.length]} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey={xAxisKey} stroke="#888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {categories.map((cat, idx) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stroke={PALETTE[idx % PALETTE.length]}
                  fillOpacity={1}
                  fill={`url(#grad-${idx})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Pie
                data={chartData}
                dataKey={dataKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={45}
                paddingAngle={4}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius={80}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey={xAxisKey} stroke="#aaa" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#666" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {categories.map((cat, idx) => (
                <Radar
                  key={cat}
                  name={cat}
                  dataKey={cat}
                  stroke={PALETTE[idx % PALETTE.length]}
                  fill={PALETTE[idx % PALETTE.length]}
                  fillOpacity={0.35}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        );

      case "bar":
      default:
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey={xAxisKey} stroke="#888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              {categories.map((cat, idx) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  fill={PALETTE[idx % PALETTE.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const getIcon = () => {
    switch (chartType) {
      case "pie":
        return <PieIcon className="w-4 h-4 text-purple-400" />;
      case "line":
      case "area":
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case "radar":
        return <Activity className="w-4 h-4 text-amber-400" />;
      default:
        return <BarChart3 className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <Card className={cn("overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#18181e] to-[#101014] shadow-xl")}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 bg-white/[0.03] py-3 px-4">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
            {getIcon()}
            {title}
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground/90">{description}</CardDescription>
        </div>
        {data?.metrics && (
          <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-[10px] text-sky-300 font-mono">
            {data.metrics}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-4">
        {renderChart()}
      </CardContent>
    </Card>
  );
}
