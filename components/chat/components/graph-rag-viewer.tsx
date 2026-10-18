"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Network,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  Layers,
  Database,
  ExternalLink,
  Info,
  Search,
  Filter,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GraphNode, GraphEdge, MultiHopPath, GraphRagQueryResult, NodeType } from "@/lib/graph-rag/types";
import { cn } from "@/lib/utils";

interface GraphRagViewerProps {
  data?: Partial<GraphRagQueryResult> & {
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    paths?: MultiHopPath[];
    summary?: string;
    cypherQuery?: string;
    engineUsed?: "neo4j-live" | "graph-store-fallback";
    mode?: "neo4j-live" | "graph-store-fallback" | "local-engine";
    query?: string;
    insights?: string[];
  };
  onDockToStage?: () => void;
  onSendMessage?: (text: string) => void;
  className?: string;
}

const TYPE_COLORS: Record<string, string> = {
  User: "#aff33e",
  Skill: "#10b981",
  Experience: "#f59e0b",
  Role: "#6366f1",
  Company: "#ec4899",
  Project: "#06b6d4",
  Education: "#8b5cf6",
  Achievement: "#eab308",
  TargetRole: "#3b82f6",
  MemoryFact: "#a855f7",
};

export function GraphRagViewer({ data, onSendMessage, className }: GraphRagViewerProps) {
  const [activeTab, setActiveTab] = useState<"graph" | "paths" | "cypher" | "entities">("graph");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCypher, setCopiedCypher] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const nodes = useMemo(() => data?.nodes || [], [data?.nodes]);
  const edges = useMemo(() => data?.edges || [], [data?.edges]);
  const paths = useMemo(() => data?.paths || [], [data?.paths]);
  const engineUsed = data?.engineUsed || "graph-store-fallback";

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchType = filterType === "ALL" || n.type === filterType;
      const matchSearch =
        !searchQuery ||
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [nodes, filterType, searchQuery]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  // Filtered edges
  const filteredEdges = useMemo(() => {
    return edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
  }, [edges, filteredNodeIds]);

  // Compute node positions with a deterministic force-directed circle layout
  const nodePositions = useMemo(() => {
    const posMap = new Map<string, { x: number; y: number }>();
    const centerX = 360;
    const centerY = 240;

    // Place user node at center
    const userNode = nodes.find((n) => n.type === "User");
    if (userNode) {
      posMap.set(userNode.id, { x: centerX, y: centerY });
    }

    // Group other nodes by type
    const nonUserNodes = nodes.filter((n) => n.type !== "User");
    const count = nonUserNodes.length;

    nonUserNodes.forEach((node, idx) => {
      // Stratify rings by node type
      let radius = 170;
      if (node.type === "TargetRole") radius = 110;
      else if (node.type === "Project" || node.type === "Experience") radius = 150;
      else if (node.type === "Skill") radius = 220;
      else if (node.type === "MemoryFact") radius = 260;

      const angle = (idx / (count || 1)) * 2 * Math.PI + (idx % 2 ? 0.2 : -0.2);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      posMap.set(node.id, { x, y });
    });

    return posMap;
  }, [nodes]);

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCopyCypher = () => {
    if (data?.cypherQuery) {
      navigator.clipboard.writeText(data.cypherQuery);
      setCopiedCypher(true);
      setTimeout(() => setCopiedCypher(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#121217]/95 backdrop-blur-2xl text-white shadow-2xl overflow-hidden my-3 max-w-full",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-gradient-to-r from-emerald-500/[0.08] via-transparent to-indigo-500/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Network className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold tracking-tight text-white">Neo4j Graphical RAG Grounding</h4>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-semibold px-2 py-0.5 rounded-full border",
                  engineUsed === "neo4j-live"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                )}
              >
                {engineUsed === "neo4j-live" ? "Live Neo4j Aura / Bolt" : "Local Graph RAG Engine"}
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Multi-hop career knowledge traversal connecting skills, projects, and target roles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternate Engine Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (onSendMessage) {
                onSendMessage(`Alternate to LangChain Vector RAG: Analyze semantic vector embeddings and confidence scores for "${data?.query || "Candidate skills and career qualifications"}".`);
              }
            }}
            className="h-7 px-2.5 text-[11px] bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/35 text-teal-300 gap-1.5 shadow-[0_0_15px_rgba(20,184,166,0.15)] rounded-lg transition-all"
            title="Alternate between Neo4j Graphical RAG and LangChain Vector RAG with Confidence Scores"
          >
            <Layers className="size-3 text-teal-400" />
            <span className="font-medium">Alternate to Vector RAG</span>
          </Button>

          {/* View Switcher Tabs */}
          <div className="flex items-center bg-[#1c1c22] p-0.5 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("graph")}
              className={cn(
                "px-3 py-1 rounded-lg font-medium transition-all",
                activeTab === "graph" ? "bg-white/15 text-white shadow-sm" : "text-neutral-400 hover:text-white"
              )}
            >
              Graph View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paths")}
              className={cn(
                "px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5",
                activeTab === "paths" ? "bg-white/15 text-white shadow-sm" : "text-neutral-400 hover:text-white"
              )}
            >
              Multi-Hop Paths
              {paths.length > 0 && (
                <span className="size-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
                  {paths.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("entities")}
              className={cn(
                "px-3 py-1 rounded-lg font-medium transition-all",
                activeTab === "entities" ? "bg-white/15 text-white shadow-sm" : "text-neutral-400 hover:text-white"
              )}
            >
              Entities ({nodes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cypher")}
              className={cn(
                "px-3 py-1 rounded-lg font-medium transition-all",
                activeTab === "cypher" ? "bg-white/15 text-white shadow-sm" : "text-neutral-400 hover:text-white"
              )}
            >
              Cypher
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "graph" && (
        <div className="relative">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-white/[0.06] bg-[#16161b]/80 text-xs">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1 mr-1">
                <Filter className="size-3" /> Filter:
              </span>
              {["ALL", "Skill", "Project", "TargetRole", "Experience", "Company"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all border",
                    filterType === type
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-white/[0.04] text-neutral-400 border-transparent hover:text-neutral-200"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Zoom / Pan controls */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
                className="h-6 w-6 text-neutral-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
                className="h-6 w-6 text-neutral-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-6 w-6 text-neutral-400 hover:text-white"
                title="Reset View"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* SVG Canvas */}
          <div
            className="h-[360px] w-full overflow-hidden bg-[#0d0d12] cursor-grab active:cursor-grabbing relative select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <svg className="w-full h-full">
              <g
                transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                style={{ transformOrigin: "360px 240px", transition: isDragging ? "none" : "transform 0.15s ease-out" }}
              >
                {/* Relationship Edges */}
                {filteredEdges.map((edge) => {
                  const sourcePos = nodePositions.get(edge.source);
                  const targetPos = nodePositions.get(edge.target);
                  if (!sourcePos || !targetPos) return null;

                  const isConnectedToSelected =
                    selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

                  return (
                    <g key={edge.id}>
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={isConnectedToSelected ? "#aff33e" : "rgba(255, 255, 255, 0.12)"}
                        strokeWidth={isConnectedToSelected ? 2 : 1}
                        strokeDasharray={edge.type.includes("PROVES") || edge.type.includes("TARGETS") ? "3,3" : undefined}
                      />
                    </g>
                  );
                })}

                {/* Graph Nodes */}
                {filteredNodes.map((node) => {
                  const pos = nodePositions.get(node.id) || { x: 360, y: 240 };
                  const isSelected = selectedNode?.id === node.id;
                  const nodeColor = TYPE_COLORS[node.type] || "#94a3b8";

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Glow halo */}
                      {isSelected && (
                        <circle
                          r={node.size ? node.size + 8 : 22}
                          fill={nodeColor}
                          opacity={0.25}
                          className="animate-pulse"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={node.size ? node.size : 14}
                        fill="#181820"
                        stroke={nodeColor}
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />

                      {/* Inner dot */}
                      <circle r={node.type === "User" ? 6 : 4} fill={nodeColor} />

                      {/* Node Label */}
                      <text
                        dy={node.size ? node.size + 14 : 24}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize={node.type === "User" ? 11 : 9.5}
                        fontWeight={node.type === "User" || isSelected ? "700" : "500"}
                        className="pointer-events-none drop-shadow-md"
                      >
                        {node.label.length > 20 ? `${node.label.slice(0, 18)}…` : node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Selected Node Details Floating Overlay */}
            {selectedNode && (
              <div className="absolute bottom-3 left-3 max-w-sm rounded-xl border border-white/15 bg-[#14141a]/95 backdrop-blur-xl p-3 shadow-2xl text-xs z-10 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[selectedNode.type] || "#aff33e" }}
                    />
                    <span className="font-semibold text-white">{selectedNode.label}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-neutral-400">
                    {selectedNode.type}
                  </Badge>
                </div>
                <div className="space-y-1 text-[11px] text-neutral-300">
                  {Object.entries(selectedNode.properties || {}).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-2">
                      <span className="text-neutral-500 capitalize">{k}:</span>
                      <span className="text-neutral-200 text-right truncate max-w-[200px]">
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedNode(null)}
                  className="w-full mt-2 h-6 text-[10px] text-neutral-400 hover:text-white"
                >
                  Close inspector
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multi-Hop Paths Tab */}
      {activeTab === "paths" && (
        <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
            <span>Discovered {paths.length} multi-hop structural proof paths:</span>
            <span className="text-[11px] text-emerald-400">Grounded in Graph RAG</span>
          </div>

          {paths.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No multi-hop paths found. Sync your resume and Memory Vault to build graph chains.
            </div>
          ) : (
            paths.map((path, idx) => (
              <div
                key={path.id || idx}
                className="p-3 rounded-xl border border-white/[0.08] bg-[#16161c] hover:border-white/15 transition-all text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/25">
                    Path #{idx + 1}
                  </Badge>
                  <span className="text-[10px] text-neutral-500">{path.nodes.length} Hops</span>
                </div>
                <p className="text-[11px] text-neutral-200 leading-relaxed font-mono">
                  {path.description}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Entities Tab */}
      {activeTab === "entities" && (
        <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto no-scrollbar">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-2.5 text-neutral-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search graph entities..."
              className="h-8 pl-8 text-xs bg-[#17171e] border-white/10 rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {filteredNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNode(node);
                  setActiveTab("graph");
                }}
                className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.06] bg-[#16161c] hover:bg-[#1f1f26] hover:border-white/15 transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[node.type] || "#aff33e" }}
                  />
                  <span className="font-medium text-white truncate">{node.label}</span>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-neutral-400 shrink-0">
                  {node.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cypher Query Tab */}
      {activeTab === "cypher" && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Generated Cypher Query for Neo4j:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyCypher}
              className="h-7 text-xs bg-[#1f1f26] border-white/10 text-white"
            >
              {copiedCypher ? <Check className="size-3 text-emerald-400 mr-1" /> : <Copy className="size-3 mr-1" />}
              {copiedCypher ? "Copied" : "Copy Cypher"}
            </Button>
          </div>
          <pre className="p-3.5 rounded-xl bg-[#0d0d12] border border-white/10 text-[11px] font-mono text-emerald-300/90 overflow-x-auto whitespace-pre leading-relaxed">
            {data?.cypherQuery ||
              `MATCH p = (u:User)-[r:HAS_SKILL|BUILT_PROJECT|TARGETS_ROLE*1..3]->(target)
RETURN p
LIMIT 25;`}
          </pre>
          <p className="text-[11px] text-neutral-400 leading-normal">
            💡 This Cypher query can be executed directly in Neo4j Browser, Neo4j Bloom, or via Bolt driver connections.
          </p>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-white/[0.08] bg-[#141418] text-xs text-neutral-400">
        <div className="flex items-center gap-3">
          <span>
            Nodes: <strong className="text-white">{nodes.length}</strong>
          </span>
          <span>
            Edges: <strong className="text-white">{edges.length}</strong>
          </span>
          <span>
            Paths: <strong className="text-white">{paths.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <CheckCircle2 className="size-3" />
          <span>Graph Grounded RAG</span>
        </div>
      </div>
    </div>
  );
}
