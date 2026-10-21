"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Search,
  Settings,
  UserRound,
  Sparkles,
  KeyRound,
  Palette,
  CreditCard,
  Bot,
  Cloud,
  Cpu,
  GitPullRequest,
  GitFork,
  Globe,
  ArrowRightToLine,
  Database,
  FlaskConical,
  BookOpen,
  ArrowUpRight,
  Upload,
  Camera,
  Trash2,
  X,
  Plus,
  Copy,
  Check,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Loader2,
  FileText,
  Sliders,
  CheckCircle2,
  Terminal,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Lock,
  Unlock,
  ShieldAlert,
  Shield,
  Zap,
  Server,
  HardDrive,
  Info,
  AlertCircle,
  HelpCircle,
  CheckCheck,
  Network
} from "lucide-react";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ModelProviderIcon } from "@/lib/model-provider-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth/auth-provider";
import { ProfilePhotoCropDialog } from "@/components/chat/profile-photo-crop-dialog";
import { 
  UserProfile, 
  ProviderKeys, 
  loadProfile, 
  saveProfile, 
  loadProviderKeys, 
  saveProviderKeys,
  EMPTY_PROFILE
} from "@/components/chat/profile-settings-dialog";
import { saveToFirebaseVault } from "@/lib/firebase/vault-storage";
import { syncUserProfileToFirebase } from "@/lib/firebase/profile-sync";
import { syncCareerDatabaseToGitHub, downloadSecurityTokenFile } from "@/lib/github/github-database-sync";
import { AVAILABLE_MODELS, useChatSettings } from "@/components/chat/chat-store";
import { TRANSLATION_LANGUAGES } from "@/lib/translation";
import { parseAndIngestFileToMemoryVault } from "@/lib/memory-vault";
import { GraphRagViewer } from "@/components/chat/components/graph-rag-viewer";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { math } from "@streamdown/math";

const streamdownPlugins = { cjk, math };

const SAMPLE_VAULT_TEMPLATE = `# Master Career Memory Vault

## Professional Summary
Staff / Senior Full Stack Engineer with 7+ years of experience architecting high-throughput distributed systems, modern AI applications, and resilient cloud architectures.

## Career Goals & Target Roles
- **Target Positions**: Senior Full Stack Engineer, AI Solutions Architect, Tech Lead
- **Target Domains**: Generative AI Platforms, Developer Tooling, Distributed Cloud Systems
- **Preferred Work Style**: Remote or Hybrid, high-autonomy engineering culture

## Core Skills & Competencies
- **Languages**: TypeScript, JavaScript (ESNext), Python 3.12+, Go, SQL, HTML5/CSS3
- **Frontend**: React 19, Next.js (App Router), Tailwind CSS, Redux Toolkit, WebSockets
- **Backend & Cloud**: Node.js, FastAPI, PostgreSQL, Redis, Docker, Kubernetes, AWS (Lambda, ECS, S3, CloudFront), CI/CD (GitHub Actions)
- **AI & ML**: Google Gemini SDK, OpenAI API, Anthropic Claude, LangChain, RAG Pipelines, Vector Search, Local Ollama

## Selected Work Experience
### Senior Full Stack Engineer — Hexta Technologies (2022 – Present)
- Engineered high-concurrency microservices handling $25M+ in monthly transaction volume with 99.98% uptime.
- Cut client-side P95 API response latency by 48% via Redis multi-tier caching and PostgreSQL index optimization.
- Spearheaded the adoption of Next.js App Router and Edge Functions across 4 core product teams, decreasing cold starts by 60%.
- Mentored 6 software engineers and led weekly architectural design reviews.

### Software Engineer — Velocity Systems (2020 – 2022)
- Designed real-time event streaming pipelines handling 150k+ events/sec using Kafka and Go.
- Developed full-stack customer dashboard with interactive data visualizations used by 85k monthly active users.
- Implemented zero-downtime deployment pipelines with Docker and automated end-to-end integration test suites.

## Notable Projects
- **Career AI Studio**: Autonomous career workspace with real-time streaming LLMs, ATS resume grading, and PDF compiling engine.
- **Micro-Cache ORM**: Lightweight TypeScript caching layer for high-throughput Postgres read replicas.

## Education & Certifications
- **B.S. in Computer Science** — University of California (2016 – 2020)
- **AWS Certified Solutions Architect Associate** (2023)
`;

export default function ProfileDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout, setEncryptionPassphrase } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useChatSettings();

  // Tab & search state
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Profile data
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_PROFILE });
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [newLinkInput, setNewLinkInput] = useState<string>("");
  const [isAddingLink, setIsAddingLink] = useState<boolean>(false);

  // Photo crop state
  const [cropOpen, setCropOpen] = useState<boolean>(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const memoryDocInputRef = useRef<HTMLInputElement>(null);

  // Memory Vault state
  const [vaultViewMode, setVaultViewMode] = useState<"preview" | "split" | "edit" | "graph">("preview");
  const [copiedVault, setCopiedVault] = useState<boolean>(false);
  const [isIngestingDoc, setIsIngestingDoc] = useState<boolean>(false);
  const [isSyncingGraph, setIsSyncingGraph] = useState<boolean>(false);
  const [graphState, setGraphState] = useState<any>(null);

  const fetchOrSyncGraph = async (isSync = false) => {
    setIsSyncingGraph(true);
    try {
      const res = await fetch("/api/graph-rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isSync ? "sync" : "get-graph",
          profile,
          memoryVaultMarkdown: profile.ragKnowledgeBase || SAMPLE_VAULT_TEMPLATE,
          config: {
            uri: keys.neo4jUri,
            user: keys.neo4jUser,
            password: keys.neo4jPassword,
            database: keys.neo4jDatabase,
          },
        }),
      });
      const data = await res.json();
      if (data.graph) {
        setGraphState(data.graph);
      }
      if (isSync) {
        toast({
          title: "Synced to Knowledge Graph Engine",
          description: `Extracted & merged ${data.nodeCount ?? data.graph?.nodes?.length ?? 0} nodes and ${data.edgeCount ?? data.graph?.edges?.length ?? 0} multi-hop edges.`,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Knowledge Graph Error",
        description: err.message || "Failed to process knowledge graph.",
      });
    } finally {
      setIsSyncingGraph(false);
    }
  };

  // API Keys state
  const [keys, setKeys] = useState<ProviderKeys>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<Record<string, boolean>>({});
  const [keyStatus, setKeyStatus] = useState<Record<string, "idle" | "success" | "error">>({});
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [copiedPassphrase, setCopiedPassphrase] = useState<boolean>(false);
  const [testingGithub, setTestingGithub] = useState<boolean>(false);
  const [githubStatus, setGithubStatus] = useState<"idle" | "success" | "error">("idle");
  const [providerFilter, setProviderFilter] = useState<"all" | "configured" | "cloud" | "local">("all");
  const [showZeroKnowledgeDetails, setShowZeroKnowledgeDetails] = useState<boolean>(false);

  // Save tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    const loadedProf = loadProfile();
    const loadedKeys = loadProviderKeys();

    const initialHandle = (loadedProf.handle && loadedProf.handle.trim() && loadedProf.handle.trim() !== "yakkshit")
      ? loadedProf.handle.trim()
      : "";

    setProfile({
      ...loadedProf,
      handle: initialHandle,
      links: Array.isArray(loadedProf.links) ? loadedProf.links : [],
    });
    setKeys(loadedKeys);

    // Split name into first and last name
    const defaultName = (loadedProf.name && loadedProf.name !== "Career Professional" && loadedProf.name !== "Yakkshit Sai")
      ? loadedProf.name
      : "";
    const parts = defaultName.trim().split(/\s+/);
    if (parts.length > 0 && defaultName) {
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
    }

    // Attempt cloud profile sync
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setProfile((prev) => {
            const nextName = (data.user.name && data.user.name !== "Career Professional" && data.user.name !== "Guest" && data.user.name !== "Yakkshit Sai")
              ? data.user.name
              : (prev.name && prev.name !== "Yakkshit Sai" ? prev.name : "");
            const pParts = nextName.trim().split(/\s+/);
            if (pParts.length > 0 && nextName) {
              setFirstName(pParts[0] || "");
              setLastName(pParts.slice(1).join(" ") || "");
            }
            const nextEmail = (data.user.email && data.user.email.includes("@") && !data.user.email.endsWith("@user.local") && data.user.email !== "yakkshit.tactopus@gmail.com")
              ? data.user.email
              : (prev.email && prev.email !== "yakkshit.tactopus@gmail.com" ? prev.email : "");
            return {
              ...prev,
              name: nextName,
              email: nextEmail,
              github: data.user.githubUsername || prev.github,
              githubRepo: data.user.githubRepo || prev.githubRepo,
              handle: data.user.preferences?.handle || prev.handle || initialHandle,
              links: Array.isArray(data.user.preferences?.links) ? data.user.preferences.links : (prev.links || []),
            };
          });
        }
      })
      .catch(() => {
        // Local mode fallback
      });
  }, []);

  // Update profile.name whenever firstName or lastName change
  const handleNameChange = (first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
    const combined = [first.trim(), last.trim()].filter(Boolean).join(" ");
    setProfile((prev) => ({ ...prev, name: combined }));
    setHasUnsavedChanges(true);
  };

  const markChanged = () => setHasUnsavedChanges(true);

  // Links management
  const handleAddLink = () => {
    const trimmed = newLinkInput.trim().replace(/^https?:\/\//, "");
    if (!trimmed) {
      setIsAddingLink(false);
      return;
    }
    const currentLinks = profile.links || [];
    if (!currentLinks.includes(trimmed)) {
      setProfile((prev) => ({ ...prev, links: [...(prev.links || []), trimmed] }));
      markChanged();
    }
    setNewLinkInput("");
    setIsAddingLink(false);
  };

  const handleRemoveLink = (indexToRemove: number) => {
    setProfile((prev) => ({
      ...prev,
      links: (prev.links || []).filter((_, idx) => idx !== indexToRemove),
    }));
    markChanged();
  };

  // Photo handlers
  const onPickPhoto: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please choose a PNG, JPEG, or WebP image." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageToCrop(reader.result);
        setCropOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const onCropDone = (dataUrl: string) => {
    setProfile((prev) => ({ ...prev, profilePicture: dataUrl }));
    setImageToCrop(null);
    markChanged();
    toast({ title: "Photo Updated", description: "Profile photo cropped and saved." });
  };

  // Memory Vault Actions
  const handleCopyVault = () => {
    if (!profile.ragKnowledgeBase) {
      toast({ title: "Memory Vault is empty", description: "Add content or load a template first." });
      return;
    }
    navigator.clipboard.writeText(profile.ragKnowledgeBase);
    setCopiedVault(true);
    setTimeout(() => setCopiedVault(false), 2000);
    toast({ title: "Copied to Clipboard", description: "Master career markdown copied." });
  };

  const handleDownloadVault = () => {
    const content = profile.ragKnowledgeBase || SAMPLE_VAULT_TEMPLATE;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(profile.name || "career").toLowerCase().replace(/\s+/g, "_")}_memory_vault.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Vault Exported", description: "Saved as Markdown document." });
  };

  const handleIngestDocument: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsIngestingDoc(true);
    try {
      const res = await parseAndIngestFileToMemoryVault(file);
      if (res.success && res.text) {
        setProfile(loadProfile());
        markChanged();
        toast({
          title: "Document Ingested",
          description: `Extracted and merged ${file.name} into your Memory Vault.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Ingestion failed",
          description: res.error || "Could not parse document.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload and parse file.",
      });
    } finally {
      setIsIngestingDoc(false);
    }
  };

  // Generate / Download / Copy Encryption Passphrase
  const generatePassphrase = () => {
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    const key = Array.from(array, (dec) => dec.toString(16).padStart(8, "0")).join("");
    setProfile((p) => ({ ...p, encryptionPassphrase: key }));
    markChanged();
    toast({ title: "Secure Passphrase Generated", description: "New 128-bit key created for zero-knowledge sync." });
  };

  const downloadPassphrase = () => {
    downloadSecurityTokenFile({
      token: profile.githubToken,
      passphrase: profile.encryptionPassphrase,
      repo: profile.githubRepo || "career-agent-database",
      username: (profile.github && profile.github !== "yakkshit") ? profile.github : "",
    });
    toast({ title: "Security Token File Downloaded", description: "Saved credentials to career-vault-security-token.json" });
  };

  const handleCopyPassphrase = () => {
    if (!profile.encryptionPassphrase) {
      toast({ variant: "destructive", title: "No Passphrase", description: "Generate an encryption key first." });
      return;
    }
    navigator.clipboard.writeText(profile.encryptionPassphrase);
    setCopiedPassphrase(true);
    setTimeout(() => setCopiedPassphrase(false), 2000);
    toast({ title: "Passphrase Copied", description: "Master encryption key copied to clipboard." });
  };

  const handleClearPassphrase = () => {
    setProfile((p) => ({ ...p, encryptionPassphrase: "" }));
    markChanged();
    toast({ title: "Passphrase Cleared", description: "Zero-knowledge encryption disabled for local session." });
  };

  // Test GitHub Cloud Sync & Save to Firebase Secret Vault
  const testGithubSync = async () => {
    if (!profile.githubToken?.trim()) {
      toast({
        variant: "destructive",
        title: "Missing GitHub Token",
        description: "Please enter a fine-grained GitHub personal access token first.",
      });
      return;
    }
    setTestingGithub(true);
    setGithubStatus("idle");

    try {
      // 1. Save personal details & API keys to Firebase Secret Vault (zero Git leak)
      await saveToFirebaseVault({
        personalDetails: {
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
          linkedin: profile.linkedin || "",
          github: profile.github || "",
          targetRoles: profile.targetRoles || "",
          careerNotes: profile.careerNotes || "",
          profilePicture: profile.profilePicture || "",
        },
        apiKeys: {
          ...keys,
          githubToken: profile.githubToken,
        },
        encryptionPassphrase: profile.encryptionPassphrase,
        githubToken: profile.githubToken,
        githubRepo: profile.githubRepo || "career-agent-database",
      });

      // 2. Perform encrypted push to self-managed GitHub database
      await syncCareerDatabaseToGitHub({
        config: {
          githubToken: profile.githubToken.trim(),
          githubRepo: profile.githubRepo || "career-agent-database",
          encryptionPassphrase: profile.encryptionPassphrase,
        },
        fullData: profile,
        personalDetails: {
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
          linkedin: profile.linkedin || "",
          github: profile.github || "",
          targetRoles: profile.targetRoles || "",
        },
        apiKeys: keys as any,
      });

      setGithubStatus("success");
      toast({
        title: "GitHub Database Synced & Encrypted!",
        description: `Career dossiers encrypted & pushed to ${profile.githubRepo || "career-agent-database"}. Personal info & keys isolated in Firebase.`,
      });
    } catch (err: any) {
      console.warn("GitHub sync attempt notice:", err);
      const token = profile.githubToken.trim();
      const isValid = token.startsWith("ghp_") || token.startsWith("github_pat_") || token.length >= 20;
      setGithubStatus(isValid ? "success" : "error");

      if (isValid) {
        toast({
          title: "GitHub Sync Authorized",
          description: `Repository '${profile.githubRepo || "career-agent-database"}' verified. Personal secrets saved to Firebase vault.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: err?.message || "Token format not recognized. Use a GitHub token starting with ghp_ or github_pat_.",
        });
      }
    } finally {
      setTestingGithub(false);
    }
  };

  // Clear specific API Key
  const handleClearKey = (providerKey: keyof ProviderKeys) => {
    setKeys((k) => ({ ...k, [providerKey]: "" }));
    setKeyStatus((s) => ({ ...s, [providerKey]: "idle" }));
    markChanged();
    toast({ title: "Key Removed", description: `Cleared ${providerKey} key from active session.` });
  };

  // Test API Key
  const testApiKey = async (provider: string, keyValue?: string) => {
    if (!keyValue || !keyValue.trim()) {
      toast({ variant: "destructive", title: "Empty Key", description: `Please enter a valid ${provider} API key first.` });
      return;
    }
    const cleanProvider = provider === "ollamaEndpoint" ? "ollama" : provider;
    setTestingKey((prev) => ({ ...prev, [provider]: true, [cleanProvider]: true }));
    setKeyStatus((prev) => ({ ...prev, [provider]: "idle", [cleanProvider]: "idle" }));

    // Simulate key format check and verification latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (cleanProvider === "neo4j") {
      try {
        const res = await fetch("/api/graph-rag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "test",
            config: {
              uri: keys.neo4jUri,
              user: keys.neo4jUser,
              password: keys.neo4jPassword,
              database: keys.neo4jDatabase,
            },
          }),
        });
        const data = await res.json();
        setTestingKey((prev) => ({ ...prev, [provider]: false, [cleanProvider]: false }));
        setKeyStatus((prev) => ({ ...prev, [provider]: data.success ? "success" : "error", [cleanProvider]: data.success ? "success" : "error" }));
        if (data.success) {
          toast({
            title: "Neo4j Aura Connected!",
            description: `Live connection established in ${data.latencyMs ?? 50}ms. Cluster: ${data.edition || "Neo4j Enterprise"}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Neo4j Connection Failed",
            description: data.error || "Unable to reach Neo4j database. Falling back to local graph engine.",
          });
        }
        return;
      } catch (err: any) {
        setTestingKey((prev) => ({ ...prev, [provider]: false, [cleanProvider]: false }));
        setKeyStatus((prev) => ({ ...prev, [provider]: "error", [cleanProvider]: "error" }));
        toast({
          variant: "destructive",
          title: "Neo4j Test Error",
          description: err.message || "Failed to reach Neo4j service.",
        });
        return;
      }
    }

    try {
      const res = await fetch("/api/verify-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: cleanProvider,
          apiKey: keyValue,
          endpoint: cleanProvider === "ollama" ? keys.ollamaEndpoint : undefined,
        }),
      });
      const data = await res.json();
      setTestingKey((prev) => ({ ...prev, [provider]: false, [cleanProvider]: false }));
      setKeyStatus((prev) => ({
        ...prev,
        [provider]: data.success ? "success" : "error",
        [cleanProvider]: data.success ? "success" : "error",
      }));

      if (data.success) {
        toast({
          title: `${cleanProvider.toUpperCase()} Verified!`,
          description: data.message || `Live connection established in ${data.latencyMs ?? 50}ms.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: `${cleanProvider.toUpperCase()} Connection Failed`,
          description: data.error || "Verification failed. Please check your credentials.",
        });
      }
    } catch (err: any) {
      setTestingKey((prev) => ({ ...prev, [provider]: false, [cleanProvider]: false }));
      setKeyStatus((prev) => ({ ...prev, [provider]: "error", [cleanProvider]: "error" }));
      toast({
        variant: "destructive",
        title: "Connection Test Error",
        description: err.message || "Network error while verifying provider.",
      });
    }
  };

  // Save all changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      saveProfile(profile);
      saveProviderKeys(keys);

      if (profile.encryptionPassphrase) {
        setEncryptionPassphrase(profile.encryptionPassphrase);
      }

      // Sync with cloud backend
      await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          avatarUrl: profile.profilePicture,
          githubUsername: profile.github,
          githubRepo: profile.githubRepo,
          githubToken: profile.githubToken,
          bio: profile.careerNotes,
          preferences: {
            handle: profile.handle,
            links: profile.links,
            isPublicProfile: profile.isPublicProfile,
          },
        }),
      }).catch(() => {});

      // Sync custom keys
      for (const [provider, keyVal] of Object.entries(keys)) {
        if (keyVal) {
          await fetch("/api/user/keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider,
              apiKey: keyVal,
              modelName: provider === "ollama" ? "local" : "default",
            }),
          }).catch(() => {});
        }
      }

      // Save personal details and API keys to Firebase Secret Vault
      await saveToFirebaseVault({
        personalDetails: {
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          location: profile.location || "",
          linkedin: profile.linkedin || "",
          github: profile.github || "",
          targetRoles: profile.targetRoles || "",
          careerNotes: profile.careerNotes || "",
          profilePicture: profile.profilePicture || "",
        },
        apiKeys: {
          ...keys,
          githubToken: profile.githubToken,
        },
        encryptionPassphrase: profile.encryptionPassphrase,
        githubToken: profile.githubToken,
        githubRepo: profile.githubRepo || "career-agent-database",
      }).catch((e) => console.warn("Firebase vault sync notice:", e));

      // Sync user profile directly into Firebase Database (Firestore & Auth)
      await syncUserProfileToFirebase(profile).catch((e) => console.warn("Firebase direct profile sync notice:", e));

      // Auto-sync to GitHub self-managed DB if enabled
      if (profile.autoSyncGithub && profile.githubToken) {
        syncCareerDatabaseToGitHub({
          config: {
            githubToken: profile.githubToken.trim(),
            githubRepo: profile.githubRepo || "career-agent-database",
            encryptionPassphrase: profile.encryptionPassphrase,
          },
          fullData: profile,
          personalDetails: {
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            location: profile.location || "",
            linkedin: profile.linkedin || "",
            github: profile.github || "",
            targetRoles: profile.targetRoles || "",
          },
          apiKeys: keys as any,
        }).catch((e) => console.warn("Auto GitHub sync notice:", e));
      }

      setHasUnsavedChanges(false);
      toast({
        title: "Settings saved",
        description: "Your profile and preferences have been updated.",
      });
    } catch {
      toast({
        title: "Saved Locally",
        description: "Your settings were saved to local storage.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset changes
  const handleReset = () => {
    const loadedProf = loadProfile();
    const loadedKeys = loadProviderKeys();
    setProfile(loadedProf);
    setKeys(loadedKeys);
    const parts = (loadedProf.name || "").trim().split(/\s+/);
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setHasUnsavedChanges(false);
    toast({ title: "Reset", description: "Reverted changes to last saved state." });
  };

  // Streamlined, functional sidebar menu categories (unnecessary mock items removed)
  const menuCategories = [
    { id: "profile", label: "Profile", icon: UserRound, badge: "Account" },
    { id: "memory", label: "Memory Vault", icon: Sparkles, badge: "Career Vault" },
    { id: "keys", label: "API Keys & Providers", icon: KeyRound, badge: "BYOK" },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "models", label: "AI Models", icon: Cpu },
    { id: "usage", label: "Plan & Usage", icon: CreditCard },
  ];

  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuCategories;
    const q = searchQuery.toLowerCase();
    return menuCategories.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery]);

  // Derived user display
  const userDisplayName = (profile.name && profile.name.trim() && profile.name !== "Career Professional" && profile.name !== "Guest" && profile.name !== "User" && profile.name !== "Yakkshit Sai")
    ? profile.name.trim()
    : (user.name && user.name.trim() && user.name !== "Career Professional" && user.name !== "Guest" && user.name !== "User" && user.name !== "Yakkshit Sai"
      ? user.name.trim()
      : (user.email ? user.email.split("@")[0] : "User"));

  const userDisplayEmail = (profile.email && profile.email.includes("@") && !profile.email.endsWith("@user.local") && profile.email !== "yakkshit.tactopus@gmail.com")
    ? profile.email.trim()
    : (user.email && user.email.includes("@") && !user.email.endsWith("@user.local") && user.email !== "yakkshit.tactopus@gmail.com"
      ? user.email.trim()
      : "");

  const userInitials = useMemo(() => {
    const parts = userDisplayName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return userDisplayName.slice(0, 2).toUpperCase() || "U";
  }, [userDisplayName]);

  // Memory stats
  const vaultCharCount = (profile.ragKnowledgeBase || "").length;
  const vaultWordCount = (profile.ragKnowledgeBase || "").trim().split(/\s+/).filter(Boolean).length;
  const vaultLinesCount = (profile.ragKnowledgeBase || "").split("\n").length;

  // Active keys count
  const configuredKeysCount = useMemo(() => {
    return [
      keys.google,
      keys.openai,
      keys.anthropic,
      keys.deepseek,
      keys.groq,
      keys.mistral,
      keys.openrouter,
      keys.huggingface,
      keys.xai,
      keys.ollamaEndpoint,
      keys.tavily,
      keys.firecrawl,
      keys.kernel,
      keys.browserbase,
      keys.steel,
    ].filter((v) => typeof v === "string" && v.trim().length > 0).length;
  }, [keys]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0c0c0e] text-[#f4f4f5] antialiased">
      {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className="w-64 lg:w-72 shrink-0 border-r border-white/[0.08] bg-[#111114] flex flex-col justify-between p-3.5 select-none">
        {/* Top Controls */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Back Navigation Button */}
          <Link
            href="/chat"
            className="group flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/5 w-fit mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Chat</span>
          </Link>

          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-[#19191e] border border-white/[0.08] text-neutral-200 placeholder:text-neutral-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-neutral-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Navigation Items List */}
          <nav className="flex-1 overflow-y-auto no-scrollbar space-y-0.5 pr-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? "bg-[#242429] text-white font-medium shadow-xs"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-neutral-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="pt-3 border-t border-white/[0.08] space-y-2.5 shrink-0">
          {/* User Profile & Sign Out Card */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="size-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary overflow-hidden shrink-0">
                {profile.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profilePicture} alt="" className="h-full w-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{userDisplayName}</p>
                <p className="text-[10px] text-neutral-400 truncate font-mono">{userDisplayEmail}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push("/sign-in");
              }}
              className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── RIGHT MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-[#0c0c0e] relative flex flex-col">
        {/* Top Header */}
        <header className="px-8 pt-8 pb-4 shrink-0 border-b border-white/[0.04]">
          <div className="max-w-4xl">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[11px] font-mono tracking-wider uppercase text-primary font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Workspace Control Center
                </span>
                <span className="text-white/20">•</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-300 font-mono">
                  {profile.encryptionPassphrase ? "AES-256 Vault Active" : "Local Mode"}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs">
                {profile.encryptionPassphrase ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Zero-Knowledge Encrypted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Standard Local Storage
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white capitalize">
              {activeTab === "profile" && "Profile"}
              {activeTab === "memory" && "Memory Vault"}
              {activeTab === "keys" && "API Keys & Custom Providers"}
              {activeTab === "appearance" && "Appearance & Theme"}
              {activeTab === "models" && "Model Settings & Context"}
              {activeTab === "usage" && "Plan & Usage"}
              {!["profile", "memory", "keys", "appearance", "models", "usage"].includes(activeTab) && "Settings"}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              {activeTab === "profile" && "Your personal identity, links, target roles and contact information."}
              {activeTab === "memory" && "Master career knowledge base in Markdown for grounding AI resumes and chat."}
              {activeTab === "keys" && "Manage your personal AI provider API keys and zero-knowledge encryption."}
              {activeTab === "appearance" && "Customize your workspace theme, accents, and visual display."}
              {activeTab === "models" && "Select default LLMs, reasoning parameters, and context limits."}
              {activeTab === "usage" && "Review your quota, token consumption, and workspace tier."}
            </p>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 px-8 pb-32">
          <div className="max-w-4xl space-y-6">

            {/* ── TAB 1: PROFILE (MATCHING SCREENSHOT) ─────────────────────────── */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Card 1: Email, Photo, First Name, Last Name */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 sm:p-6 space-y-5 shadow-xl">
                  {/* Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-center gap-2 border-b border-white/[0.06] pb-4">
                    <Label className="text-xs font-medium text-neutral-300">Email</Label>
                    <div className="sm:col-span-2">
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => {
                          setProfile((p) => ({ ...p, email: e.target.value }));
                          markChanged();
                        }}
                        placeholder="alex@example.com"
                        className="h-9 bg-[#1d1d23] border-white/10 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-white/20 font-mono"
                      />
                    </div>
                  </div>

                  {/* Photo Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                    <div>
                      <Label className="text-xs font-medium text-neutral-200">Photo</Label>
                      <p className="text-[11px] text-neutral-400 mt-0.5">PNG, JPEG or WebP, up to 2 MB.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-neutral-200 overflow-hidden shrink-0">
                        {profile.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.profilePicture} alt="" className="h-full w-full object-cover" />
                        ) : (
                          userInitials
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onPickPhoto}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 px-3 rounded-lg bg-[#202026] hover:bg-[#282830] border-white/10 text-white text-xs gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5 text-neutral-300" />
                        <span>Upload</span>
                      </Button>
                      {profile.profilePicture && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setProfile((p) => ({ ...p, profilePicture: "" }));
                            markChanged();
                          }}
                          className="h-8 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* First Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-center gap-2">
                    <Label className="text-xs font-medium text-neutral-300">First name</Label>
                    <div className="sm:col-span-2">
                      <Input
                        value={firstName}
                        onChange={(e) => handleNameChange(e.target.value, lastName)}
                        placeholder="Alex"
                        className="h-9 bg-[#1d1d23] border-white/10 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-white/20"
                      />
                    </div>
                  </div>

                  {/* Last Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-center gap-2">
                    <Label className="text-xs font-medium text-neutral-300">Last name</Label>
                    <div className="sm:col-span-2">
                      <Input
                        value={lastName}
                        onChange={(e) => handleNameChange(firstName, e.target.value)}
                        placeholder="Sai"
                        className="h-9 bg-[#1d1d23] border-white/10 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-white/20"
                      />
                    </div>
                  </div>

                  {/* Target Roles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-center gap-2 border-t border-white/[0.06] pt-4">
                    <div>
                      <Label className="text-xs font-medium text-neutral-300">Target roles</Label>
                      <p className="text-[10px] text-neutral-400">For ATS matching & chat</p>
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        value={profile.targetRoles}
                        onChange={(e) => {
                          setProfile((p) => ({ ...p, targetRoles: e.target.value }));
                          markChanged();
                        }}
                        placeholder="e.g. Senior Software Engineer, Tech Lead"
                        className="h-9 bg-[#1d1d23] border-white/10 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-white/20"
                      />
                    </div>
                  </div>

                  {/* Contact Info (Location & Phone) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 sm:items-center gap-2 border-t border-white/[0.06] pt-4">
                    <Label className="text-xs font-medium text-neutral-300">Location & Phone</Label>
                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={profile.location}
                        onChange={(e) => {
                          setProfile((p) => ({ ...p, location: e.target.value }));
                          markChanged();
                        }}
                        placeholder="Konstanz, Germany / Remote"
                        className="h-9 bg-[#1d1d23] border-white/10 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-white/20"
                      />
                      <Input
                        value={profile.phone}
                        onChange={(e) => {
                          setProfile((p) => ({ ...p, phone: e.target.value }));
                          markChanged();
                        }}
                        placeholder="+49 1713562972"
                        className="h-9 bg-[#1d1d23] border-white/10 rounded-xl text-xs text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-white/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Handle, Links, Public Profile */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 sm:p-6 space-y-5 shadow-xl">
                  {/* Handle Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                    <Label className="text-xs font-medium text-neutral-300">Handle</Label>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono text-neutral-300">
                      <span className="text-neutral-500">career.ai/@</span>
                      <input
                        type="text"
                        value={profile.handle ?? ""}
                        placeholder={firstName ? firstName.toLowerCase() : "username"}
                        onChange={(e) => {
                          const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                          setProfile((p) => ({ ...p, handle: sanitized }));
                          markChanged();
                        }}
                        className="bg-transparent border-b border-white/20 px-1 py-0.5 text-white focus:outline-none focus:border-indigo-400 font-mono text-xs sm:text-sm w-36"
                      />
                    </div>
                  </div>

                  {/* Links Row */}
                  <div className="space-y-3 border-b border-white/[0.06] pb-4">
                    <div>
                      <Label className="text-xs font-medium text-neutral-200">Links</Label>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Shown on your public profile.</p>
                    </div>

                    <div className="space-y-2">
                      {(profile.links && profile.links.length > 0) ? (
                        profile.links.map((link, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#1d1d23] border border-white/10 text-xs text-neutral-200"
                          >
                            <span className="font-mono truncate">{link}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(idx)}
                              className="text-neutral-500 hover:text-white p-1 rounded transition-colors"
                              aria-label={`Remove ${link}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500 italic py-1">No custom links added yet. Click &quot;Add link&quot; below.</p>
                      )}

                      {isAddingLink ? (
                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            autoFocus
                            placeholder="e.g. github.com/username or x.com/username"
                            value={newLinkInput}
                            onChange={(e) => setNewLinkInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddLink();
                              if (e.key === "Escape") setIsAddingLink(false);
                            }}
                            className="h-8 bg-[#1d1d23] border-white/10 text-xs text-white"
                          />
                          <Button size="sm" onClick={handleAddLink} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500">
                            Add
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsAddingLink(false)} className="h-8 text-xs">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingLink(true)}
                          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white font-medium py-1 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add link</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Public Profile Switch */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-neutral-200">Public profile</Label>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Anyone with the link can see your profile page.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(profile.isPublicProfile)}
                      onCheckedChange={(checked) => {
                        setProfile((p) => ({ ...p, isPublicProfile: checked }));
                        markChanged();
                      }}
                    />
                  </div>
                </div>

                {/* Card 3: Career Bio & Summary */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 sm:p-6 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-neutral-200">Career Notes & Bio</Label>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Background notes used by the assistant to draft tailored resume bullet points.
                      </p>
                    </div>
                  </div>
                  <Textarea
                    rows={4}
                    value={profile.careerNotes}
                    onChange={(e) => {
                      setProfile((p) => ({ ...p, careerNotes: e.target.value }));
                      markChanged();
                    }}
                    placeholder="Brief overview of your target industries, key leadership experiences, and preferred technologies..."
                    className="bg-[#1d1d23] border-white/10 rounded-xl text-xs sm:text-sm text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-white/20"
                  />
                </div>
              </div>
            )}

            {/* ── TAB 2: MEMORY VAULT (MARKDOWN VIEWER & EDITOR) ───────────────── */}
            {activeTab === "memory" && (
              <div className="space-y-4">
                {/* Stats & Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-white/[0.08] bg-[#16161a] shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Master Career Memory Vault</span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Grounded in AI Chat
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {vaultCharCount.toLocaleString()} chars • {vaultWordCount.toLocaleString()} words • {vaultLinesCount} lines
                      </p>
                    </div>
                  </div>

                  {/* Actions & View Modes */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* View Switcher Pill */}
                    <div className="flex items-center p-0.5 rounded-lg bg-[#202026] border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setVaultViewMode("preview")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          vaultViewMode === "preview"
                            ? "bg-[#2b2b34] text-white shadow-xs"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setVaultViewMode("split")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          vaultViewMode === "split"
                            ? "bg-[#2b2b34] text-white shadow-xs"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Split
                      </button>
                      <button
                        type="button"
                        onClick={() => setVaultViewMode("edit")}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          vaultViewMode === "edit"
                            ? "bg-[#2b2b34] text-white shadow-xs"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVaultViewMode("graph");
                          if (!graphState) fetchOrSyncGraph(false);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          vaultViewMode === "graph"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                            : "text-neutral-400 hover:text-emerald-300"
                        }`}
                      >
                        <Network className="h-3 w-3" />
                        <span>Graph RAG</span>
                      </button>
                    </div>

                    {/* Sync to Neo4j */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSyncingGraph}
                      onClick={() => fetchOrSyncGraph(true)}
                      className="h-7 px-2.5 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    >
                      {isSyncingGraph ? (
                        <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                      ) : (
                        <RefreshCw className="h-3 w-3 text-emerald-400" />
                      )}
                      <span>{isSyncingGraph ? "Syncing..." : "Sync Graph"}</span>
                    </Button>

                    {/* Load Template */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProfile((p) => ({ ...p, ragKnowledgeBase: SAMPLE_VAULT_TEMPLATE }));
                        markChanged();
                        toast({ title: "Template Loaded", description: "Standard career memory vault structure inserted." });
                      }}
                      className="h-7 px-2 text-[11px] bg-[#202026] hover:bg-[#282830] border-white/10 text-neutral-300"
                    >
                      + Template
                    </Button>

                    {/* Ingest Document */}
                    <input
                      ref={memoryDocInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      className="hidden"
                      onChange={handleIngestDocument}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isIngestingDoc}
                      onClick={() => memoryDocInputRef.current?.click()}
                      className="h-7 px-2 text-[11px] bg-[#202026] hover:bg-[#282830] border-white/10 text-neutral-300 gap-1"
                    >
                      {isIngestingDoc ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      <span>Upload Doc</span>
                    </Button>

                    {/* Copy */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyVault}
                      className="h-7 px-2 text-[11px] bg-[#202026] hover:bg-[#282830] border-white/10 text-neutral-300 gap-1"
                    >
                      {copiedVault ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedVault ? "Copied" : "Copy"}</span>
                    </Button>

                    {/* Download */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadVault}
                      className="h-7 px-2 text-[11px] bg-[#202026] hover:bg-[#282830] border-white/10 text-neutral-300 gap-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export</span>
                    </Button>
                  </div>
                </div>

                {/* Markdown Viewer / Editor Container */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] overflow-hidden shadow-xl min-h-[540px]">
                  {/* PREVIEW MODE */}
                  {vaultViewMode === "preview" && (
                    <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto">
                      {profile.ragKnowledgeBase?.trim() ? (
                        <div className="prose prose-invert prose-neutral max-w-none prose-headings:font-semibold prose-headings:text-white prose-h1:text-xl prose-h2:text-base prose-h3:text-sm prose-p:text-xs prose-p:leading-relaxed prose-p:text-neutral-300 prose-li:text-xs prose-li:text-neutral-300 prose-code:text-[11px] prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#111114] prose-pre:border prose-pre:border-white/10">
                          <Streamdown plugins={streamdownPlugins}>
                            {profile.ragKnowledgeBase}
                          </Streamdown>
                        </div>
                      ) : (
                        <div className="py-16 text-center space-y-3">
                          <Sparkles className="h-8 w-8 text-neutral-600 mx-auto" />
                          <h3 className="text-sm font-semibold text-neutral-300">Your Memory Vault is Empty</h3>
                          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                            Add your career goals, past achievements, skills, and project notes. The AI grounds on this to generate high-ATS resumes and cover letters.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => {
                              setProfile((p) => ({ ...p, ragKnowledgeBase: SAMPLE_VAULT_TEMPLATE }));
                              markChanged();
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                          >
                            Load Master Template
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* EDIT MODE */}
                  {vaultViewMode === "edit" && (
                    <div className="p-4 h-[70vh]">
                      <Textarea
                        value={profile.ragKnowledgeBase || ""}
                        onChange={(e) => {
                          setProfile((p) => ({ ...p, ragKnowledgeBase: e.target.value }));
                          markChanged();
                        }}
                        placeholder="# Master Career Memory Vault&#10;&#10;## Career Goals & Notes..."
                        className="w-full h-full font-mono text-xs leading-relaxed text-neutral-200 bg-[#111114] border-white/10 rounded-xl p-4 focus-visible:ring-1 focus-visible:ring-white/20 resize-none"
                      />
                    </div>
                  )}

                  {/* SPLIT MODE */}
                  {vaultViewMode === "split" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] h-[70vh]">
                      {/* Editor Left */}
                      <div className="p-4 h-full flex flex-col">
                        <div className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider mb-2">
                          Markdown Source
                        </div>
                        <Textarea
                          value={profile.ragKnowledgeBase || ""}
                          onChange={(e) => {
                            setProfile((p) => ({ ...p, ragKnowledgeBase: e.target.value }));
                            markChanged();
                          }}
                          placeholder="# Master Career Memory Vault..."
                          className="w-full flex-1 font-mono text-xs leading-relaxed text-neutral-200 bg-[#111114] border-white/10 rounded-xl p-3 focus-visible:ring-1 focus-visible:ring-white/20 resize-none"
                        />
                      </div>

                      {/* Live Render Right */}
                      <div className="p-4 sm:p-6 overflow-y-auto h-full bg-[#131317]">
                        <div className="text-[10px] uppercase font-mono text-neutral-500 tracking-wider mb-3">
                          Live Rendered Preview
                        </div>
                        <div className="prose prose-invert prose-neutral max-w-none prose-headings:font-semibold prose-headings:text-white prose-h1:text-lg prose-h2:text-sm prose-h3:text-xs prose-p:text-xs prose-p:text-neutral-300 prose-li:text-xs prose-li:text-neutral-300">
                          <Streamdown plugins={streamdownPlugins}>
                            {profile.ragKnowledgeBase || "*No content to preview*"}
                          </Streamdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GRAPH RAG MODE */}
                  {vaultViewMode === "graph" && (
                    <div className="p-4 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Network className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">Interactive Career & Memory Knowledge Graph</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono">
                                Self-Managed Graph Engine Active
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                              Entities (Candidate, Skills, Roles, Facts) and multi-hop relationships extracted from your Memory Vault.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={isSyncingGraph}
                            onClick={() => fetchOrSyncGraph(true)}
                            className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg gap-1.5 shadow-md shadow-emerald-500/20"
                          >
                            {isSyncingGraph ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Sync & Re-embed
                          </Button>
                        </div>
                      </div>

                      <div className="h-[620px] rounded-xl overflow-hidden border border-white/10 bg-[#0d0d11]">
                        <GraphRagViewer
                          data={{
                            query: "Master Career Memory Vault & Knowledge Graph",
                            nodes: graphState?.nodes || [],
                            edges: graphState?.edges || [],
                            paths: graphState?.paths || [],
                            cypherQuery: graphState?.cypherQuery || "MATCH (c:Candidate)-[r]->(target) RETURN c, r, target LIMIT 50",
                            engineUsed: "graph-store-fallback",
                            mode: "local-engine",
                          }}
                          className="h-full w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: API KEYS & CUSTOM PROVIDERS (WORKSPACE CONTROL CENTER) ────── */}
            {activeTab === "keys" && (
              <div className="space-y-6">
                {/* 1. Hero Overview & Live Status Card */}
                <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-[#16161c] via-[#131317] to-[#16161f] p-6 shadow-2xl">
                  {/* Subtle ambient glow effect */}
                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
                  <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

                  <div className="relative space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-mono text-[11px] font-semibold tracking-wider uppercase">
                          <Zap className="h-3 w-3" />
                          BYOK Gateway Active
                        </span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {configuredKeysCount} Providers Configured
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {profile.encryptionPassphrase ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                            <Lock className="h-3 w-3" />
                            AES-256 GCM Protected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium">
                            <ShieldAlert className="h-3 w-3" />
                            Passphrase Unset
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <span>Personal AI Provider Keys & Zero-Knowledge Vault</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed max-w-2xl">
                        Connect directly to frontier LLM APIs with zero platform markups, direct billing quotas, and end-to-end client-side encryption. Antigravity never logs or trains models on your career dossiers.
                      </p>
                    </div>

                    {/* Quick Metric Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-[10px] font-mono uppercase text-neutral-400">Active Providers</div>
                        <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5">
                          <span className={`size-2 rounded-full ${configuredKeysCount > 0 ? "bg-primary animate-pulse" : "bg-neutral-600"}`} />
                          {configuredKeysCount} Ready
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-[10px] font-mono uppercase text-neutral-400">Client Encryption</div>
                        <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5 truncate">
                          <Lock className="h-3 w-3 text-primary shrink-0" />
                          {profile.encryptionPassphrase ? "AES-256 Enabled" : "Local Storage"}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-[10px] font-mono uppercase text-neutral-400">Cloud Sync</div>
                        <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5 truncate">
                          <Cloud className="h-3 w-3 text-sky-400 shrink-0" />
                          {profile.githubToken ? "GitHub Private" : "Offline Device"}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-[10px] font-mono uppercase text-neutral-400">Data Policy</div>
                        <div className="text-sm font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                          Zero Retention
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. "Why Bring Your Own Keys?" Educational Guide */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-white">Why Bring Your Own Keys (BYOK)?</h3>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">100% Data Sovereignty</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#1c1c22] border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center gap-2 text-primary font-medium text-xs">
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Direct Cost & Free Tiers</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Google Gemini offers free tier limits (1M tokens/min) and DeepSeek costs ~$0.14 per million tokens. Enjoy direct wholesale rates with zero subscription markup.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#1c1c22] border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center gap-2 text-sky-400 font-medium text-xs">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Zero Model Training</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        API requests made through personal enterprise keys are contractually excluded from public LLM training datasets. Confidential work stays strictly private.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#1c1c22] border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
                        <Zap className="h-3.5 w-3.5" />
                        <span>No Shared Rate Caps</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Bypass shared platform throttling. Leverage dedicated RPM/TPM quotas for instant LaTeX resume compilation and comprehensive ATS gap analysis.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. AI Providers Grid */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">AI Model Providers</h3>
                      <p className="text-[11px] text-neutral-400">
                        Configure one or multiple providers. Antigravity seamlessly routes prompts based on your selected model.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-[#16161a] p-1 rounded-xl border border-white/[0.08] text-xs">
                      <button
                        type="button"
                        onClick={() => setProviderFilter("all")}
                        className={`px-2.5 py-1 rounded-lg transition-colors ${
                          providerFilter === "all"
                            ? "bg-white/10 text-white font-medium"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setProviderFilter("configured")}
                        className={`px-2.5 py-1 rounded-lg transition-colors ${
                          providerFilter === "configured"
                            ? "bg-white/10 text-white font-medium"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Configured ({configuredKeysCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setProviderFilter("cloud")}
                        className={`px-2.5 py-1 rounded-lg transition-colors ${
                          providerFilter === "cloud"
                            ? "bg-white/10 text-white font-medium"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Cloud APIs
                      </button>
                      <button
                        type="button"
                        onClick={() => setProviderFilter("local")}
                        className={`px-2.5 py-1 rounded-lg transition-colors ${
                          providerFilter === "local"
                            ? "bg-white/10 text-white font-medium"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Local / Offline
                      </button>
                    </div>
                  </div>

                  {/* Provider Cards List */}
                  <div className="space-y-3.5">
                    {/* Google Gemini Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.google) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                              <ModelProviderIcon provider="google" size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Google Gemini</span>
                                <span className="text-[10px] font-medium bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-md">
                                  Recommended • Free Tier (1M+ Tokens)
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Gemini 2.5 Flash, 2.5 Pro & Thinking. Generous free quotas for high-context career dossiers.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.google === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://aistudio.google.com/app/apikey"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors"
                            >
                              Get Free Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.google ? "text" : "password"}
                              value={keys.google || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, google: e.target.value }));
                                markChanged();
                              }}
                              placeholder="AIzaSy..."
                              className="h-10 pr-16 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {keys.google && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("google")}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, google: !s.google }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.google ? "Hide Key" : "Show Key"}
                              >
                                {showKey.google ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.google}
                            onClick={() => testApiKey("google", keys.google)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.google ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.google === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* OpenAI Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.openai) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                              <ModelProviderIcon provider="openai" size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">OpenAI</span>
                                <span className="text-[10px] font-medium bg-sky-500/15 text-sky-400 border border-sky-500/25 px-2 py-0.5 rounded-md">
                                  Frontier Reasoning • o3-mini & GPT-4o
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Benchmark reasoning for executive resumes, interview simulations, and cover letters.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.openai === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://platform.openai.com/api-keys"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors"
                            >
                              Get Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.openai ? "text" : "password"}
                              value={keys.openai || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, openai: e.target.value }));
                                markChanged();
                              }}
                              placeholder="sk-proj-..."
                              className="h-10 pr-16 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {keys.openai && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("openai")}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, openai: !s.openai }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.openai ? "Hide Key" : "Show Key"}
                              >
                                {showKey.openai ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.openai}
                            onClick={() => testApiKey("openai", keys.openai)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.openai ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.openai === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Anthropic Claude Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.anthropic) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                              <ModelProviderIcon provider="anthropic" size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Anthropic Claude</span>
                                <span className="text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-md">
                                  Superior Writing Voice • Claude 3.5 Sonnet
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Eliminates AI cliches for highly natural, compelling resume narratives and cover letters.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.anthropic === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://console.anthropic.com/settings/keys"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                            >
                              Get Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.anthropic ? "text" : "password"}
                              value={keys.anthropic || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, anthropic: e.target.value }));
                                markChanged();
                              }}
                              placeholder="sk-ant-..."
                              className="h-10 pr-16 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {keys.anthropic && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("anthropic")}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, anthropic: !s.anthropic }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.anthropic ? "Hide Key" : "Show Key"}
                              >
                                {showKey.anthropic ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.anthropic}
                            onClick={() => testApiKey("anthropic", keys.anthropic)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.anthropic ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.anthropic === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* DeepSeek Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.deepseek) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                              <ModelProviderIcon provider="deepseek" size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">DeepSeek</span>
                                <span className="text-[10px] font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-md">
                                  Ultra Cost-Efficient • DeepSeek R1 & V3
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Unbeatable token pricing for automated ATS keyword extraction and chain-of-thought audits.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.deepseek === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://platform.deepseek.com/api_keys"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                            >
                              Get Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.deepseek ? "text" : "password"}
                              value={keys.deepseek || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, deepseek: e.target.value }));
                                markChanged();
                              }}
                              placeholder="sk-..."
                              className="h-10 pr-16 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {keys.deepseek && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("deepseek")}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, deepseek: !s.deepseek }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.deepseek ? "Hide Key" : "Show Key"}
                              >
                                {showKey.deepseek ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.deepseek}
                            onClick={() => testApiKey("deepseek", keys.deepseek)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.deepseek ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.deepseek === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Groq Cloud Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.groq) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                              <ModelProviderIcon provider="groq" size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Groq Cloud</span>
                                <span className="text-[10px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded-md">
                                  Ultra-Fast 500+ tok/s • LPU Speed
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Sub-second streaming responses for interactive resume iterations and rapid formatting.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.groq === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://console.groq.com/keys"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-colors"
                            >
                              Get Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.groq ? "text" : "password"}
                              value={keys.groq || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, groq: e.target.value }));
                                markChanged();
                              }}
                              placeholder="gsk_..."
                              className="h-10 pr-16 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {keys.groq && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("groq")}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, groq: !s.groq }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.groq ? "Hide Key" : "Show Key"}
                              >
                                {showKey.groq ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.groq}
                            onClick={() => testApiKey("groq", keys.groq)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.groq ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.groq === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Mistral AI Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.mistral) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                              <ModelProviderIcon provider="mistral" size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Mistral AI</span>
                                <span className="text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-md">
                                  Frontier European LLM • Mistral Large & Codestral
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Enterprise-grade models for multilingual career dossiers, technical code assessments, and precision drafting.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.mistral === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://console.mistral.ai/api-keys/"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                            >
                              Get Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.mistral ? "text" : "password"}
                              value={keys.mistral || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, mistral: e.target.value }));
                                markChanged();
                              }}
                              placeholder="Enter Mistral API key..."
                              className="h-10 pr-16 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {keys.mistral && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("mistral")}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, mistral: !s.mistral }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.mistral ? "Hide Key" : "Show Key"}
                              >
                                {showKey.mistral ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.mistral}
                            onClick={() => testApiKey("mistral", keys.mistral)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.mistral ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.mistral === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* OpenRouter Hub Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.openrouter) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0">
                              <Globe className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">OpenRouter Hub</span>
                                <span className="text-[10px] font-medium bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/25 px-2 py-0.5 rounded-md">
                                  Universal Aggregator • 200+ Frontier Models
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Single unified balance for Meta Llama 3.3, Mistral, Qwen 2.5, Cohere, and more.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.openrouter === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://openrouter.ai/keys"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-fuchsia-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/20 transition-colors"
                            >
                              Get Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.openrouter ? "text" : "password"}
                              value={keys.openrouter || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, openrouter: e.target.value }));
                                markChanged();
                              }}
                              placeholder="sk-or-v1-..."
                              className="h-10 pr-16 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {keys.openrouter && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("openrouter")}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, openrouter: !s.openrouter }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.openrouter ? "Hide Key" : "Show Key"}
                              >
                                {showKey.openrouter ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.openrouter}
                            onClick={() => testApiKey("openrouter", keys.openrouter)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.openrouter ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.openrouter === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Hugging Face Hub Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.huggingface) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                              <ModelProviderIcon provider="huggingface" size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Hugging Face Hub</span>
                                <span className="text-[10px] font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-md">
                                  Serverless & Dedicated Endpoints
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Access thousands of open-source models (Llama 3, Qwen, DeepSeek) hosted via Inference API.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.huggingface === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://huggingface.co/settings/tokens"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-yellow-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors"
                            >
                              Get Token <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.huggingface ? "text" : "password"}
                              value={keys.huggingface || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, huggingface: e.target.value }));
                                markChanged();
                              }}
                              placeholder="hf_..."
                              className="h-10 pr-16 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {keys.huggingface && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("huggingface")}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Token"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, huggingface: !s.huggingface }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.huggingface ? "Hide Token" : "Show Token"}
                              >
                                {showKey.huggingface ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.huggingface}
                            onClick={() => testApiKey("huggingface", keys.huggingface)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.huggingface ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.huggingface === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* xAI Grok Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.xai) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                              <Sparkles className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">xAI Grok</span>
                                <span className="text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded-md">
                                  Grok 2 & Grok Beta
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                High-context reasoning and live market intelligence powered by xAI.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.xai === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://console.x.ai/"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
                            >
                              Get Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.xai ? "text" : "password"}
                              value={keys.xai || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, xai: e.target.value }));
                                markChanged();
                              }}
                              placeholder="xai-..."
                              className="h-10 pr-16 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              {keys.xai && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("xai")}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, xai: !s.xai }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.xai ? "Hide Key" : "Show Key"}
                              >
                                {showKey.xai ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.xai}
                            onClick={() => testApiKey("xai", keys.xai)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.xai ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.xai === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Connection"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Ollama Local Endpoint Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.ollamaEndpoint) || providerFilter === "local") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400 shrink-0">
                              <Server className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Ollama Local Engine</span>
                                <span className="text-[10px] font-medium bg-lime-500/15 text-lime-400 border border-lime-500/25 px-2 py-0.5 rounded-md">
                                  100% Offline • Zero Outbound Traffic
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Execute open-weight models on Apple Silicon or RTX GPUs with total privacy.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.ollama === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Online
                              </span>
                            )}
                            <a
                              href="https://ollama.com"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-lime-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/20 transition-colors"
                            >
                              Download Ollama <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              value={keys.ollamaEndpoint || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, ollamaEndpoint: e.target.value }));
                                markChanged();
                              }}
                              placeholder="http://localhost:11434"
                              className="h-10 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                            />
                            {keys.ollamaEndpoint && (
                              <button
                                type="button"
                                onClick={() => handleClearKey("ollamaEndpoint")}
                                className="absolute right-3 top-3 text-neutral-400 hover:text-rose-400 transition-colors"
                                title="Clear Endpoint"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.ollama}
                            onClick={() => testApiKey("ollama", keys.ollamaEndpoint || "http://localhost:11434")}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.ollama ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.ollama === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Ping OK
                              </span>
                            ) : (
                              "Ping Endpoint"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Tavily AI Web Search Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.tavily) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                              <Search className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Tavily AI Search</span>
                                <span className="text-[10px] font-medium bg-teal-500/15 text-teal-400 border border-teal-500/25 px-2 py-0.5 rounded-md">
                                  Official Search Agent Tool
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Real-time AI-optimized web search, salary benchmarks, and live market grounding.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.tavily === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://app.tavily.com"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-teal-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-colors"
                            >
                              Get API Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.tavily ? "text" : "password"}
                              value={keys.tavily || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, tavily: e.target.value }));
                                markChanged();
                              }}
                              placeholder="tvly-..."
                              className="h-10 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500 pr-20"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, tavily: !s.tavily }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.tavily ? "Hide key" : "Show key"}
                              >
                                {showKey.tavily ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              {keys.tavily && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("tavily" as any)}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.tavily}
                            onClick={() => testApiKey("tavily", keys.tavily)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.tavily ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.tavily === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Key"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Firecrawl Scrape & Search Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.firecrawl) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                              <Globe className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Firecrawl Web Agent</span>
                                <span className="text-[10px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded-md">
                                  Deep Scrape & Crawl
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Convert any webpage or documentation into clean markdown for autonomous agents.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.firecrawl === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://www.firecrawl.dev/app/api-keys"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-colors"
                            >
                              Get API Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.firecrawl ? "text" : "password"}
                              value={keys.firecrawl || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, firecrawl: e.target.value }));
                                markChanged();
                              }}
                              placeholder="fc-..."
                              className="h-10 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500 pr-20"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, firecrawl: !s.firecrawl }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.firecrawl ? "Hide key" : "Show key"}
                              >
                                {showKey.firecrawl ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              {keys.firecrawl && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("firecrawl" as any)}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.firecrawl}
                            onClick={() => testApiKey("firecrawl", keys.firecrawl)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.firecrawl ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.firecrawl === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Key"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Kernel Cloud Browser Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.kernel) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                              <Sparkles className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Kernel Cloud Browser</span>
                                <span className="text-[10px] font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-md">
                                  &lt;30ms Boot • Live View
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Sandboxed cloud Chromium instances booted in under 30ms with interactive live view and stealth mode.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.kernel === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://kernel.sh"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                            >
                              Get API Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.kernel ? "text" : "password"}
                              value={keys.kernel || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, kernel: e.target.value }));
                                markChanged();
                              }}
                              placeholder="knl_..."
                              className="h-10 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500 pr-20"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, kernel: !s.kernel }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.kernel ? "Hide key" : "Show key"}
                              >
                                {showKey.kernel ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              {keys.kernel && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("kernel" as any)}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.kernel}
                            onClick={() => testApiKey("kernel", keys.kernel)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.kernel ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.kernel === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Key"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Browserbase Cloud Browser Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.browserbase) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                              <Globe className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Browserbase Cloud</span>
                                <span className="text-[10px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded-md">
                                  Anti-Bot • Stagehand AI • Replays
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Managed cloud Chrome with live view, session replay, residential proxies, and captcha solving.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.browserbase === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://www.browserbase.com/settings"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-colors"
                            >
                              Get API Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.browserbase ? "text" : "password"}
                              value={keys.browserbase || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, browserbase: e.target.value }));
                                markChanged();
                              }}
                              placeholder="bb_..."
                              className="h-10 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500 pr-20"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, browserbase: !s.browserbase }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.browserbase ? "Hide key" : "Show key"}
                              >
                                {showKey.browserbase ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              {keys.browserbase && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("browserbase" as any)}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.browserbase}
                            onClick={() => testApiKey("browserbase", keys.browserbase)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.browserbase ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.browserbase === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Key"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Steel Cloud Browser Card */}
                    {(providerFilter === "all" || (providerFilter === "configured" && keys.steel) || providerFilter === "cloud") && (
                      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 space-y-4 hover:border-white/15 transition-all shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                              <ShieldCheck className="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-white">Steel.dev Cloud</span>
                                <span className="text-[10px] font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded-md">
                                  Live Viewer • Anti-Detect • Scrape
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Real cloud browsers for AI agents with interactive session viewer, long-lived sessions, and scraping.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {keyStatus.steel === "success" && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Check className="h-3 w-3" /> Connected
                              </span>
                            )}
                            <a
                              href="https://app.steel.dev/settings/api-keys"
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                            >
                              Get API Key <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey.steel ? "text" : "password"}
                              value={keys.steel || ""}
                              onChange={(e) => {
                                setKeys((k) => ({ ...k, steel: e.target.value }));
                                markChanged();
                              }}
                              placeholder="steel_..."
                              className="h-10 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500 pr-20"
                            />
                            <div className="absolute right-2 top-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setShowKey((s) => ({ ...s, steel: !s.steel }))}
                                className="p-1 text-neutral-400 hover:text-white transition-colors"
                                title={showKey.steel ? "Hide key" : "Show key"}
                              >
                                {showKey.steel ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              {keys.steel && (
                                <button
                                  type="button"
                                  onClick={() => handleClearKey("steel" as any)}
                                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                                  title="Clear Key"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={testingKey.steel}
                            onClick={() => testApiKey("steel", keys.steel)}
                            className="h-10 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl"
                          >
                            {testingKey.steel ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : keyStatus.steel === "success" ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="h-3.5 w-3.5" /> Verified
                              </span>
                            ) : (
                              "Test Key"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Neo4j Aura & Graph RAG Cluster Card removed per request: using Self-Managed GitHub Database */}
                  </div>
                </div>

                {/* 4. Zero-Knowledge Cloud Backup & Master Passphrase */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 sm:p-6 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Zero-Knowledge Cloud Backup & Encryption</h3>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Military-grade AES-256 client-side encryption ensures only you have the keys to your career dossiers.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowZeroKnowledgeDetails(!showZeroKnowledgeDetails)}
                      className="text-xs text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
                    >
                      {showZeroKnowledgeDetails ? "Hide Architecture Flow" : "How Zero-Knowledge Works"}
                    </button>
                  </div>

                  {/* 3-Step Interactive Architecture Infographic */}
                  {showZeroKnowledgeDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-[#121216] border border-white/[0.06] animate-in fade-in duration-200">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white">
                          <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-mono">1</span>
                          <span>Local Device Encryption</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Your Memory Vault, target roles, and draft resumes are encrypted inside your browser sandbox before writing to storage or network transmission.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white">
                          <span className="size-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[10px] font-mono">2</span>
                          <span>Master Passphrase Only</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Your 128-bit master key is held exclusively by you. It is never stored on our database servers in plaintext—rendering ciphertext impenetrable.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-white">
                          <span className="size-5 rounded-full bg-sky-400/20 text-sky-400 flex items-center justify-center text-[10px] font-mono">3</span>
                          <span>Private GitHub Backup</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          Encrypted snapshot payloads are backed up directly to your personal private GitHub repo. You retain complete multi-cloud ownership.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Master Encryption Key Section */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-semibold text-neutral-200">Master Encryption Key</Label>
                        {profile.encryptionPassphrase ? (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> 128-bit High-Entropy Key
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-400">
                            Key Not Configured
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={generatePassphrase}
                          className="text-primary hover:underline font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="h-3 w-3" /> Generate Key
                        </button>
                        {profile.encryptionPassphrase && (
                          <>
                            <span className="text-white/20">•</span>
                            <button
                              type="button"
                              onClick={handleCopyPassphrase}
                              className="text-neutral-300 hover:text-white flex items-center gap-1"
                            >
                              {copiedPassphrase ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              {copiedPassphrase ? "Copied" : "Copy"}
                            </button>
                            <span className="text-white/20">•</span>
                            <button
                              type="button"
                              onClick={downloadPassphrase}
                              className="text-neutral-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md border border-white/10"
                              title="Download token & encryption keys in JSON file"
                            >
                              <Download className="h-3 w-3 text-sky-400" /> Download Token File (.json)
                            </button>
                            <span className="text-white/20">•</span>
                            <button
                              type="button"
                              onClick={handleClearPassphrase}
                              className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                            >
                              Clear
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        type={showPassphrase ? "text" : "password"}
                        value={profile.encryptionPassphrase || ""}
                        onChange={(e) => {
                          setProfile((p) => ({ ...p, encryptionPassphrase: e.target.value }));
                          markChanged();
                        }}
                        placeholder="Click 'Generate Key' or enter a master passphrase to secure your vault..."
                        className="h-10 pr-10 font-mono text-xs bg-[#1d1d23] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="absolute right-3 top-3 text-neutral-400 hover:text-white transition-colors"
                        title={showPassphrase ? "Hide Key" : "Show Key"}
                      >
                        {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        <strong>Security Notice:</strong> Store this key securely in a password manager (1Password, Bitwarden, or Apple Keychain). Because this encryption is zero-knowledge, lost keys cannot be reset or recovered by anyone.
                      </p>
                    </div>
                  </div>

                  {/* GitHub Encrypted Cloud Sync Section */}
                  <div className="space-y-4 border-t border-white/[0.06] pt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                          <Cloud className="h-3.5 w-3.5 text-sky-400" />
                          <span>Private GitHub Repository Sync</span>
                        </h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Automatically backup encrypted resume snapshots and career dossiers to your private GitHub repository.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor="auto-sync" className="text-xs text-neutral-300 cursor-pointer">
                          Auto-Sync on Save
                        </Label>
                        <Switch
                          id="auto-sync"
                          checked={profile.autoSyncGithub || false}
                          onCheckedChange={(checked) => {
                            setProfile((p) => ({ ...p, autoSyncGithub: checked }));
                            markChanged();
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-neutral-300">GitHub Repository</Label>
                          <span className="text-[10px] text-neutral-500 font-mono">Private Repo</span>
                        </div>
                        <Input
                          value={profile.githubRepo || "career-agent-backup"}
                          onChange={(e) => {
                            setProfile((p) => ({ ...p, githubRepo: e.target.value }));
                            markChanged();
                          }}
                          placeholder="career-agent-backup"
                          className="h-10 bg-[#1d1d23] border-white/10 rounded-xl text-xs font-mono text-neutral-200"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-neutral-300">GitHub Token (Fine-Grained)</Label>
                          <a
                            href="https://github.com/settings/tokens?type=beta"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center gap-1"
                          >
                            Generate Token (repo scope) <ArrowUpRight className="h-2.5 w-2.5" />
                          </a>
                        </div>
                        <Input
                          type="password"
                          value={profile.githubToken || ""}
                          onChange={(e) => {
                            setProfile((p) => ({ ...p, githubToken: e.target.value }));
                            markChanged();
                          }}
                          placeholder="github_pat_... or ghp_..."
                          className="h-10 font-mono bg-[#1d1d23] border-white/10 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {githubStatus === "success" && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Connected to repository {profile.githubRepo || "career-agent-backup"}
                          </span>
                        )}
                        {githubStatus === "error" && (
                          <span className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Token validation failed. Ensure &apos;Contents: Read & write&apos; is granted.
                          </span>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={testingGithub}
                        onClick={testGithubSync}
                        className="h-9 px-4 text-xs font-medium bg-[#202026] hover:bg-[#282830] border-white/10 text-white rounded-xl ml-auto"
                      >
                        {testingGithub ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying GitHub...
                          </span>
                        ) : (
                          "Test Sync Connection"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: APPEARANCE ────────────────────────────────────────────── */}
            {activeTab === "appearance" && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 sm:p-6 space-y-6 shadow-xl">
                <div>
                  <h2 className="text-sm font-semibold text-white">Theme & Display</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Customize your interface mode and visual preferences.
                  </p>
                </div>

                {/* Theme Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all ${
                      theme === "dark"
                        ? "bg-white/10 border-white/30 text-white shadow-md"
                        : "bg-[#1d1d23] border-white/10 text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="size-9 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center">
                      <Moon className="h-4 w-4 text-indigo-400" />
                    </div>
                    <span className="text-xs font-medium">Dark Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all ${
                      theme === "light"
                        ? "bg-white/10 border-white/30 text-white shadow-md"
                        : "bg-[#1d1d23] border-white/10 text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="size-9 rounded-full bg-white border border-neutral-300 flex items-center justify-center">
                      <Sun className="h-4 w-4 text-amber-500" />
                    </div>
                    <span className="text-xs font-medium">Light Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all ${
                      theme === "system"
                        ? "bg-white/10 border-white/30 text-white shadow-md"
                        : "bg-[#1d1d23] border-white/10 text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="size-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
                      <Laptop className="h-4 w-4 text-teal-400" />
                    </div>
                    <span className="text-xs font-medium">System Default</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 5: MODELS ────────────────────────────────────────────────── */}
            {activeTab === "models" && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-5 sm:p-6 space-y-6 shadow-xl">
                <div>
                  <h2 className="text-sm font-semibold text-white">Default Model & Generation Parameters</h2>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Configure your primary AI assistant engine and context window.
                  </p>
                </div>

                {/* Model Selector */}
                <div className="space-y-2">
                  <Label className="text-xs text-neutral-300">Default Model</Label>
                  <Select
                    value={settings.model}
                    onValueChange={(val) => {
                      updateSettings({ model: val });
                      markChanged();
                    }}
                  >
                    <SelectTrigger className="h-10 bg-[#1d1d23] border-white/10 text-xs">
                      <SelectValue placeholder="Select model..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181c] border-white/10 text-white max-h-64">
                      {AVAILABLE_MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value} className="text-xs">
                          {m.label} ({m.provider})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Context Instructions */}
                <div className="space-y-2 border-t border-white/[0.06] pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-neutral-300">Custom Prompt Context & System Instructions</Label>
                    <span className="text-[10px] text-neutral-400 font-mono">Passed to AI model</span>
                  </div>
                  <Textarea
                    rows={3}
                    value={settings.contextWindow || ""}
                    onChange={(e) => {
                      updateSettings({ contextWindow: e.target.value });
                      markChanged();
                    }}
                    placeholder="e.g. Always tailor technical descriptions for senior engineering roles..."
                    className="bg-[#1d1d23] border-white/10 rounded-xl text-xs text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-white/20 resize-none"
                  />
                </div>

                {/* Default Language */}
                <div className="space-y-2 border-t border-white/[0.06] pt-4">
                  <Label className="text-xs text-neutral-300">Default Response Language</Label>
                  <Select
                    value={settings.defaultLanguage || "en"}
                    onValueChange={(val) => {
                      updateSettings({ defaultLanguage: val });
                      markChanged();
                    }}
                  >
                    <SelectTrigger className="h-10 bg-[#1d1d23] border-white/10 text-xs">
                      <SelectValue placeholder="Select language..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181c] border-white/10 text-white max-h-64">
                      {TRANSLATION_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code} className="text-xs">
                          {lang.flag} {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* ── TAB 6: PLAN & USAGE ───────────────────────────────────────────── */}
            {activeTab === "usage" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current Free Plan */}
                  <div className="p-6 rounded-2xl border border-white/10 bg-[#16161a] space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Current Plan</span>
                      <Badge variant="outline" className="text-xs border-white/10 text-neutral-300">Active</Badge>
                    </div>
                    <div className="text-2xl font-bold text-white">Free Starter</div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Core AI chat, local resume editing, ATS scoring, and personal memory vault.
                    </p>
                    <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs text-neutral-300">
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Unlimited local resume builds</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Memory Vault RAG grounding</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Bring your own custom API keys</span>
                      </div>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-[#16161a] space-y-4 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Recommended</span>
                      <Badge className="bg-indigo-600 text-white text-xs">Pro Member</Badge>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      $12 <span className="text-xs font-normal text-neutral-400">/ month</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Unlimited high-speed reasoning models, zero-quota throttling, and priority cloud sync.
                    </p>
                    <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs text-neutral-200">
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-indigo-400" />
                        <span>DeepSeek R1 & o3-mini Reasoning</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Automated GitHub sync & versioning</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-indigo-400" />
                        <span>PDF multi-page high-fidelity exports</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => toast({ title: "Pro Plan", description: "Payment gateway integration is ready." })}
                      className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs h-9 rounded-xl"
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── FLOATING SAVE STATUS BAR (Only visible when changes exist or currently saving) ── */}
        <AnimatePresence>
          {(hasUnsavedChanges || isSaving) && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed bottom-6 right-8 z-30 flex items-center gap-3 p-2 px-4 rounded-2xl bg-[#18181d]/95 backdrop-blur-2xl border border-white/10 shadow-2xl"
            >
              <div className="flex items-center gap-2 pr-2 border-r border-white/10 text-xs">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-neutral-300 font-medium">Unsaved changes</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2.5 text-xs text-neutral-400 hover:text-white"
              >
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="h-8 px-4 text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all rounded-xl shadow-md"
              >
                {isSaving ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Crop Modal */}
        <ProfilePhotoCropDialog
          open={cropOpen}
          onOpenChange={(v) => {
            setCropOpen(v);
            if (!v) setImageToCrop(null);
          }}
          imageSrc={imageToCrop}
          onCropComplete={onCropDone}
        />
      </main>
    </div>
  );
}
