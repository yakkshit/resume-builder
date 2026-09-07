"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  FileText,
  Briefcase,
  Code,
  GraduationCap,
  Upload,
  Download,
  Settings,
  Menu,
  X,
  ChevronRight,
  Bot,
  User,
  Loader2,
  Eye,
  Edit,
  Palette,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Paperclip,
  Copy,
  RotateCcw,
  Trash2,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast, Toaster } from "sonner";
import { useTheme } from "next-themes";

/**
 * Message interface for chat messages
 * @property {string} id - Unique identifier for the message
 * @property {string} role - Message sender (user or assistant)
 * @property {string} content - Message text content
 * @property {string} componentType - Optional component type to render
 * @property {any} componentData - Data for the component
 * @property {number} timestamp - Message creation timestamp
 * @property {File[]} attachedFiles - Optional array of attached files
 */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  componentType?: string;
  componentData?: any;
  timestamp: number;
  attachedFiles?: File[];
}

/**
 * ChatSession interface for managing chat sessions
 * @property {string} id - Unique session identifier
 * @property {string} title - Session title (derived from first message)
 * @property {Message[]} messages - Array of messages in the session
 * @property {number} timestamp - Session creation timestamp
 */
interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

/**
 * Resume Viewer Component
 * Displays a resume with preview, editor, and settings tabs
 */
const ResumeViewer = ({ data = {} }: { data?: any }) => {
  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/20 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Resume Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="editor">
              <Edit className="w-4 h-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Palette className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="space-y-4">
            <div className="bg-background border border-border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground">John Doe</h3>
                <p className="text-muted-foreground">Senior Software Engineer</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Experience</h4>
                <p className="text-sm text-muted-foreground">5+ years in full-stack development</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Node.js", "Python"].map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="editor">
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input placeholder="John Doe" />
              </div>
              <div>
                <Label>Title</Label>
                <Input placeholder="Senior Software Engineer" />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea placeholder="Brief professional summary..." />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="settings">
            <div className="space-y-4">
              <div>
                <Label>Template</Label>
                <Select defaultValue="modern">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color Scheme</Label>
                <Select defaultValue="blue">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

/**
 * CV Score Card Component
 * Shows CV analysis with overall score and job match percentage
 */
const CVScoreCard = ({ data = { score: 85, jobMatch: 78 } }: { data?: any }) => {
  return (
    <Card className="w-full bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          CV Score Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-sm font-bold text-primary">{data.score}%</span>
          </div>
          <Progress value={data.score} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Job Match</span>
            <span className="text-sm font-bold text-primary">{data.jobMatch}%</span>
          </div>
          <Progress value={data.jobMatch} className="h-2" />
        </div>
        <div className="pt-2">
          <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 text-primary" />
              Add more quantifiable achievements
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 text-primary" />
              Include relevant certifications
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Job Recommendations Component
 * Displays personalized job recommendations with match percentages
 */
const JobRecommendations = ({ data = [] }: { data?: any[] }) => {
  const jobs = data.length > 0 ? data : [
    { id: 1, title: "Senior Frontend Developer", company: "TechCorp", match: 92 },
    { id: 2, title: "Full Stack Engineer", company: "StartupXYZ", match: 88 },
    { id: 3, title: "React Developer", company: "BigTech Inc", match: 85 },
  ];

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/20 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          Job Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{job.title}</h4>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                </div>
                <Badge variant="secondary">{job.match}% match</Badge>
              </div>
              <Button size="sm" className="mt-2">Apply Now</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Auto Job Applier Component
 * Shows automated job application progress with Chrome browser simulation
 */
const AutoJobApplier = ({ data = {} }: { data?: any }) => {
  const [currentStep, setCurrentStep] = useState(2);
  const steps = [
    { label: "Searching jobs", status: "completed", description: "Found 15 matching positions" },
    { label: "Analyzing requirements", status: "completed", description: "Compatibility check complete" },
    { label: "Filling application", status: "in-progress", description: "Entering personal information" },
    { label: "Submitting", status: "pending", description: "Waiting..." },
  ];

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/20 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Auto Job Applier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{currentStep + 1}/{steps.length}</span>
          </div>
          <div className="relative">
            <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
          </div>
        </div>

        {/* Mini Chrome Browser View */}
        <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border border-border overflow-hidden">
          {/* Chrome Header */}
          <div className="bg-muted/80 px-3 py-2 flex items-center gap-2 border-b border-border/50">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 bg-background/50 rounded px-3 py-1 text-xs text-muted-foreground">
              https://careers.techcorp.com/apply/senior-react-developer
            </div>
          </div>
          
          {/* Browser Content */}
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="h-3 bg-primary/20 rounded w-24 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-8 bg-muted rounded" />
                <div className="h-8 bg-muted rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-primary/20 rounded w-32 animate-pulse" />
              <div className="h-16 bg-muted rounded" />
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="pt-0.5">
                {step.status === "completed" && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {step.status === "in-progress" && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {step.status === "pending" && (
                  <Clock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${step.status === "pending" ? "text-muted-foreground" : ""}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Mock Interview Generator Component
 * Interactive interview practice with questions and answer input
 */
const MockInterviewGenerator = ({ data = {} }: { data?: any }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const questions = [
    { id: 1, question: "Tell me about yourself", difficulty: "Easy", category: "Behavioral" },
    { id: 2, question: "What are your greatest strengths?", difficulty: "Medium", category: "Behavioral" },
    { id: 3, question: "Describe a challenging project you worked on", difficulty: "Hard", category: "Technical" },
  ];

  return (
    <Card className="w-full bg-gradient-to-br from-purple-500/10 via-background to-purple-500/5 border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-500" />
          Mock Interview Practice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Question {currentQuestion + 1} of {questions.length}</span>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
              {questions[currentQuestion].category}
            </Badge>
          </div>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
        </div>

        {/* Question Card */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/20">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-purple-500">{currentQuestion + 1}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{questions[currentQuestion].question}</h3>
              <Badge className="bg-purple-500/20 text-purple-600 border-0">
                {questions[currentQuestion].difficulty}
              </Badge>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-3">
            <Label className="text-sm font-medium">Your Answer</Label>
            <Textarea 
              placeholder="Start typing your answer here..." 
              className="min-h-[150px] bg-background/50 border-purple-500/20 focus:border-purple-500/50"
            />
          </div>
        </div>

        {/* Timer and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>2:30 elapsed</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))} disabled={currentQuestion === 0}>
              Previous
            </Button>
            <Button size="sm" onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))} disabled={currentQuestion === questions.length - 1}>
              Next Question
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Learning Resources Component
 * Displays recommended courses and learning materials
 */
const LearningResources = ({ data = [] }: { data?: any[] }) => {
  const resources = data.length > 0 ? data : [
    { id: 1, title: "Advanced React Patterns", platform: "Frontend Masters", duration: "4 hours", level: "Advanced", price: "Free" },
    { id: 2, title: "System Design Interview", platform: "Udemy", duration: "8 hours", level: "Intermediate", price: "$49.99" },
    { id: 3, title: "TypeScript Deep Dive", platform: "Coursera", duration: "6 hours", level: "Intermediate", price: "Free" },
  ];

  return (
    <Card className="w-full bg-gradient-to-br from-blue-500/10 via-background to-blue-500/5 border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-500" />
          Recommended Learning Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="p-4 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent hover:border-blue-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1 group-hover:text-blue-500 transition-colors">{resource.title}</h4>
                  <p className="text-sm text-muted-foreground">{resource.platform}</p>
                </div>
                <Badge className="bg-blue-500/20 text-blue-600 border-0">{resource.level}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {resource.duration}
                  </span>
                  <span className="font-semibold text-foreground">{resource.price}</span>
                </div>
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                  Start Learning
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Explore Jobs Component
 * Shows detailed job listings with filtering and application options
 */
const ExploreJobs = ({ data = [] }: { data?: any[] }) => {
  const jobs = data.length > 0 ? data : [
    { id: 1, title: "Senior React Developer", company: "TechCorp Inc", location: "Remote", salary: "$120k - $160k", type: "Full-time", posted: "2 days ago" },
    { id: 2, title: "Full Stack Engineer", company: "StartupXYZ", location: "San Francisco, CA", salary: "$130k - $180k", type: "Full-time", posted: "1 week ago" },
    { id: 3, title: "Frontend Architect", company: "BigTech Corp", location: "New York, NY", salary: "$150k - $200k", type: "Full-time", posted: "3 days ago" },
  ];

  return (
    <Card className="w-full bg-gradient-to-br from-green-500/10 via-background to-green-500/5 border-green-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-green-500" />
          Explore Job Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent hover:border-green-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1 group-hover:text-green-500 transition-colors">{job.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{job.company}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">{job.location}</Badge>
                    <Badge variant="secondary" className="text-xs">{job.type}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-green-600">{job.salary}</p>
                  <p className="text-xs text-muted-foreground">Posted {job.posted}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-green-500/30 hover:bg-green-500/10">
                    Save
                  </Button>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Coding Challenge Component
 * Interactive coding environment with problem description and code editor
 */
const CodingChallenge = ({ data = {} }: { data?: any }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("typescript");
  const [code, setCode] = useState(`function twoSum(nums: number[], target: number): number[] {
  // Your solution here
  
}`);

  return (
    <Card className="w-full bg-gradient-to-br from-orange-500/10 via-background to-orange-500/5 border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5 text-orange-500" />
          Coding Challenge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Problem Header */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-lg mb-1">Problem: Two Sum</h4>
            <div className="flex gap-2">
              <Badge className="bg-green-500/20 text-green-600 border-0">Easy</Badge>
              <Badge variant="secondary">Array</Badge>
              <Badge variant="secondary">Hash Table</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>45 min</span>
          </div>
        </div>

        <Separator />

        {/* Problem Description */}
        <div className="space-y-3">
          <h5 className="font-medium text-sm">Description</h5>
          <p className="text-sm text-muted-foreground">
            Given an array of integers <code className="bg-muted px-1 py-0.5 rounded">nums</code> and an integer <code className="bg-muted px-1 py-0.5 rounded">target</code>, return indices of the two numbers such that they add up to target.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-medium">Example:</p>
            <code className="block">
              Input: nums = [2,7,11,15], target = 9<br />
              Output: [0,1]<br />
              Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
            </code>
          </div>
        </div>

        <Separator />

        {/* Code Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Your Solution</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[200px] bg-background border-0 focus-visible:ring-1 focus-visible:ring-orange-500/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 border-orange-500/30 hover:bg-orange-500/10">
            <Play className="w-4 h-4 mr-2" />
            Run Tests
          </Button>
          <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            Submit Solution
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Component Renderer
 * Dynamically renders different component types based on the message
 */
const ComponentRenderer = ({ type, data }: { type: string; data?: any }) => {
  switch (type) {
    case "resume":
      return <ResumeViewer data={data} />;
    case "cv-score":
      return <CVScoreCard data={data} />;
    case "job-recommendations":
      return <JobRecommendations data={data} />;
    case "auto-applier":
      return <AutoJobApplier data={data} />;
    case "coding-challenge":
      return <CodingChallenge data={data} />;
    case "mock-interview":
      return <MockInterviewGenerator data={data} />;
    case "learning-resources":
      return <LearningResources data={data} />;
    case "explore-jobs":
      return <ExploreJobs data={data} />;
    default:
      return null;
  }
};

/**
 * Chat Message Component
 * Renders individual chat messages with actions (copy, reply)
 * Shows attached files if present
 */
const ChatMessage = ({ message, onReply }: { message: Message; onReply?: (content: string) => void }) => {
  const isUser = message.role === "user";
  const [showActions, setShowActions] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Copied to clipboard!", {
      duration: 2000,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? "order-first" : ""} relative`}>
        <div
          className={`relative px-4 py-3 backdrop-blur-xl border shadow-lg ${
            isUser
              ? "bg-primary/90 text-primary-foreground border-primary/20"
              : "bg-background/70 text-foreground border-border/50"
          }`}
          style={{
            borderRadius: '1rem',
            clipPath: showActions 
              ? 'path("M 0 16 Q 0 0 16 0 L calc(100% - 16) 0 Q 100% 0 100% 16 L 100% calc(100% - 32) Q 100% calc(100% - 28) 96 calc(100% - 28) Q 92 calc(100% - 28) 92 calc(100% - 24) L 92 calc(100% - 8) Q 92 calc(100% - 4) 96 calc(100% - 4) Q 100% calc(100% - 4) 100% calc(100% - 0) L 16 100% Q 0 100% 0 calc(100% - 16) Z")'
              : undefined
          }}
        >
          {message.attachedFiles && message.attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {message.attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                    isUser
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background/50 text-foreground"
                  }`}
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-[10px] opacity-70">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.componentType && (
          <div className="mt-3">
            <ComponentRenderer type={message.componentType} data={message.componentData} />
          </div>
        )}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-2 -right-12 flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-xl border border-border/50 p-1 shadow-lg"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8 rounded-lg hover:bg-muted"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </Button>
              {!isUser && onReply && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onReply(message.content)}
                  className="h-8 w-8 rounded-lg hover:bg-muted"
                  title="Reply"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
    </motion.div>
  );
};

/**
 * Sidebar Component
 * Floating glassmorphic sidebar with profile, stats, and chat history
 */
const Sidebar = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onExport,
  onImport,
  theme,
  setTheme,
  onOpenSettings,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme: string;
  setTheme: (theme: string) => void;
  onOpenSettings: () => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed left-4 top-4 bottom-4 w-80 bg-gradient-to-br from-background/60 via-background/50 to-background/60 backdrop-blur-2xl border border-white/20 rounded-2xl z-50 overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Glassmorphic overlay effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col h-full">
            {/* Header with logo */}
            <div className="p-4 border-b border-white/10 backdrop-blur-sm bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm">AI Career Assistant</h2>
                    <p className="text-xs text-muted-foreground">Your AI-powered guide</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Profile Section */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/30 transition-all cursor-pointer group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center ring-2 ring-primary/20 ring-offset-2 ring-offset-background/50">
                    <User className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">John Doe</p>
                  <p className="text-xs text-muted-foreground truncate">john@example.com</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme(theme === "dark" ? "light" : "dark");
                    }}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                  >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSettings();
                    }}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
                  <p className="text-xs font-semibold text-primary">24</p>
                  <p className="text-[10px] text-muted-foreground">Chats</p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 text-center">
                  <p className="text-xs font-semibold text-green-600">12</p>
                  <p className="text-[10px] text-muted-foreground">Applied</p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 text-center">
                  <p className="text-xs font-semibold text-cyan-600">5</p>
                  <p className="text-[10px] text-muted-foreground">Interviews</p>
                </div>
              </div>
            </div>

            {/* Export/Import Section */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm" onClick={onExport}>
                  <Download className="w-3 h-3 mr-1.5" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm" asChild>
                  <label>
                    <Upload className="w-3 h-3 mr-1.5" />
                    Import
                    <input type="file" className="hidden" accept=".json" onChange={onImport} />
                  </label>
                </Button>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 flex justify-between items-center flex-shrink-0 border-b border-white/10">
                <h3 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Chat History
                </h3>
                <Button variant="ghost" size="sm" onClick={onNewSession} className="h-7 px-2 text-xs hover:bg-white/10">
                  <ChevronRight className="w-3 h-3 mr-1" />
                  New
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0 hide-scrollbar">
                <div className="space-y-2 pb-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`relative group w-full text-left p-3 rounded-xl border transition-all ${
                        session.id === currentSessionId
                          ? "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/40 shadow-lg shadow-primary/10"
                          : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 backdrop-blur-sm"
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSessionSelect(session.id);
                          onClose();
                        }}
                        className="w-full text-left"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${
                            session.id === currentSessionId ? "bg-primary" : "bg-muted-foreground/30"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate pr-8">{session.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(session.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Main AI Career Assistant Chat Component
 * Manages chat sessions, messages, and UI state
 */
const AICareerAssistantChat = () => {
  const { theme, setTheme } = useTheme();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load saved chat sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("chat-sessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
        setMessages(parsed[0].messages);
        setShowWelcome(parsed[0].messages.length === 0);
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("chat-sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Creates a new chat session
   */
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      timestamp: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    setShowWelcome(true);
  };

  /**
   * Updates the current session with new messages
   */
  const updateCurrentSession = (newMessages: Message[]) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              messages: newMessages,
              title: newMessages[0]?.content.slice(0, 50) || "New Chat",
            }
          : session
      )
    );
  };

  /**
   * Handles sending a message with optional file attachments
   */
  const handleSend = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input || "[Attached files]",
      timestamp: Date.now(),
      attachedFiles: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setAttachedFiles([]);
    setIsLoading(true);
    setShowWelcome(false);

    setTimeout(() => {
      const responseContent = generateResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent.text,
        componentType: responseContent.componentType,
        componentData: responseContent.componentData,
        timestamp: Date.now(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      updateCurrentSession(updatedMessages);
      setIsLoading(false);
    }, 1000);
  };

  /**
   * Generates AI response based on user input
   * Routes to different component types based on keywords
   */
  const generateResponse = (userInput: string) => {
    const lower = userInput.toLowerCase();

    if (lower.includes("resume") || lower.includes("cv")) {
      return {
        text: "Here's your resume preview. You can edit it directly or customize the template in the settings tab.",
        componentType: "resume",
        componentData: {},
      };
    }

    if (lower.includes("score") || lower.includes("analyze")) {
      return {
        text: "I've analyzed your CV against the job description. Here's your compatibility score:",
        componentType: "cv-score",
        componentData: { score: 85, jobMatch: 78 },
      };
    }

    if (lower.includes("job") || lower.includes("recommend")) {
      return {
        text: "Based on your profile, here are the top job matches for you:",
        componentType: "job-recommendations",
        componentData: [],
      };
    }

    if (lower.includes("apply") || lower.includes("auto")) {
      return {
        text: "I'll help you automatically apply to relevant positions. Here's the progress:",
        componentType: "auto-applier",
        componentData: {},
      };
    }

    if (lower.includes("code") || lower.includes("challenge")) {
      return {
        text: "Let's practice with a coding challenge relevant to your target role:",
        componentType: "coding-challenge",
        componentData: {},
      };
    }

    if (lower.includes("interview") || lower.includes("practice")) {
      return {
        text: "Let me help you prepare for your interview with practice questions:",
        componentType: "mock-interview",
        componentData: {},
      };
    }

    if (lower.includes("learn") || lower.includes("course") || lower.includes("study")) {
      return {
        text: "Here are some recommended learning resources to boost your skills:",
        componentType: "learning-resources",
        componentData: [],
      };
    }

    if (lower.includes("explore") || lower.includes("search") || lower.includes("find")) {
      return {
        text: "Let me show you some exciting job opportunities that match your profile:",
        componentType: "explore-jobs",
        componentData: [],
      };
    }

    return {
      text: "I'm your AI career assistant. I can help you with:\n\n• Building and optimizing your resume\n• Analyzing job compatibility\n• Finding relevant job opportunities\n• Automating job applications\n• Preparing for technical interviews\n• Generating cover letters\n\nWhat would you like to work on?",
      componentType: undefined,
      componentData: undefined,
    };
  };

  /**
   * Exports current chat session as JSON file
   */
  const handleExport = () => {
    const currentSession = sessions.find((s) => s.id === currentSessionId);
    if (currentSession) {
      const dataStr = JSON.stringify(currentSession, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat-session-${currentSessionId}.json`;
      link.click();
      toast.success("Session exported successfully", {
        duration: 2000,
      });
    }
  };

  /**
   * Imports a chat session from JSON file
   */
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setSessions((prev) => [imported, ...prev]);
          setCurrentSessionId(imported.id);
          setMessages(imported.messages);
          setShowWelcome(imported.messages.length === 0);
          toast.success("Session imported successfully", {
            duration: 2000,
          });
        } catch (error) {
          console.error("Failed to import session");
          toast.error("Failed to import session", {
            duration: 2000,
          });
        }
      };
      reader.readAsText(file);
    }
  };

  /**
   * Handles file attachment to message
   */
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    toast.success(`${files.length} file(s) attached`, {
      duration: 2000,
    });
  };

  /**
   * Removes an attached file from the list
   */
  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    toast.info("File removed", {
      duration: 2000,
    });
  };

  /**
   * Deletes a chat session and handles cleanup
   */
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Chat deleted successfully", {
      duration: 2000,
    });
    if (id === currentSessionId) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
        setMessages(remaining[0].messages);
        setShowWelcome(remaining[0].messages.length === 0);
      } else {
        createNewSession();
      }
    }
  };

  /**
   * Prepares a reply to a specific message
   */
  const handleReply = (content: string) => {
    setInput(`Reply to: "${content.slice(0, 50)}..."\n\n`);
  };

  const suggestedPrompts = [
    "Show me my resume",
    "Analyze my CV score",
    "Find jobs for me",
    "Start auto-applying to jobs",
    "Give me a coding challenge",
  ];

  const actionPills = [
    { label: "Create", icon: FileText },
    { label: "Explore", icon: Briefcase },
    { label: "Code", icon: Code },
    { label: "Learn", icon: GraduationCap },
  ];

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="h-screen w-full relative flex overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-background to-cyan-500/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 w-full flex">
        <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={(id) => {
          const session = sessions.find((s) => s.id === id);
          if (session) {
            setCurrentSessionId(id);
            setMessages(session.messages);
            setShowWelcome(session.messages.length === 0);
          }
        }}
        onNewSession={createNewSession}
        onDeleteSession={handleDeleteSession}
        onExport={handleExport}
        onImport={handleImport}
        theme={theme || "system"}
        setTheme={setTheme}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Settings Panel */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setSettingsOpen(false)}
            />
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="fixed right-4 top-4 bottom-4 w-96 bg-gradient-to-br from-background/60 via-background/50 to-background/60 backdrop-blur-2xl border border-white/20 rounded-2xl z-50 overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Glassmorphic overlay effects */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 pointer-events-none" />
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-white/10 backdrop-blur-sm bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                        <Settings className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="font-bold text-sm">Settings</h2>
                        <p className="text-xs text-muted-foreground">Manage your preferences</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(false)} className="hover:bg-white/10">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">
                    {/* Profile Section */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center ring-2 ring-primary/20">
                              <User className="w-7 h-7 text-primary-foreground" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background/80" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">John Doe</p>
                            <p className="text-xs text-muted-foreground">john@example.com</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Full Name</Label>
                          <Input placeholder="John Doe" className="bg-white/5 border-white/10 focus:border-primary/50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Email</Label>
                          <Input type="email" placeholder="john@example.com" className="bg-white/5 border-white/10 focus:border-primary/50" />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* API Settings */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        API Configuration
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            <Code className="w-3 h-3" />
                            Context Window
                          </Label>
                          <Input type="text" placeholder="e.g., 200000" className="bg-white/5 border-white/10 focus:border-primary/50" />
                          <p className="text-[10px] text-muted-foreground">Maximum number of tokens for context</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            <Sparkles className="w-3 h-3" />
                            API Key
                          </Label>
                          <Input type="password" placeholder="sk-..." className="bg-white/5 border-white/10 focus:border-primary/50" />
                          <p className="text-[10px] text-muted-foreground">Your OpenAI or Anthropic API key</p>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Appearance */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Appearance
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2">
                            {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            <div>
                              <p className="text-sm font-medium">Theme</p>
                              <p className="text-xs text-muted-foreground">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="bg-white/5 border-white/10 hover:bg-white/10"
                          >
                            Switch
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 backdrop-blur-sm bg-white/5">
                  <Button className="w-full" onClick={() => {
                    toast.success("Settings saved successfully!", { duration: 2000 });
                    setSettingsOpen(false);
                  }}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Menu Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed top-6 left-6 z-40"
      >
        <Button
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="h-12 w-12 rounded-full shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-2 border-white/20 backdrop-blur-sm"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </motion.div>

      <div className="flex-1 flex flex-col relative">

        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth pb-32 hide-scrollbar">
          {showWelcome ? (
            <div className="h-full flex items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl w-full space-y-8 text-center"
              >
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 items-center justify-center mx-auto"
                  >
                    <Sparkles className="w-8 h-8 text-primary-foreground" />
                  </motion.div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    How can I help you?
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Your AI-powered career assistant for resumes, jobs, and interviews
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {actionPills.map((pill, index) => (
                    <motion.button
                      key={pill.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="px-6 py-3 rounded-full bg-muted hover:bg-muted/80 border border-border hover:border-primary/50 transition-all flex items-center gap-2 group"
                      onClick={() => setInput(pill.label.toLowerCase())}
                    >
                      <pill.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-medium">{pill.label}</span>
                    </motion.button>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground font-medium">Suggested prompts</p>
                  <div className="grid gap-3 max-w-2xl mx-auto">
                    {suggestedPrompts.map((prompt, index) => (
                      <motion.button
                        key={prompt}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        onClick={() => setInput(prompt)}
                        className="p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border hover:border-primary/50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{prompt}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} onReply={handleReply} />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-8 h-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Fixed Floating Input Bar */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-30">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Suggestions - Show only when no files attached */}
            {attachedFiles.length === 0 && (
              <div className="mb-3 overflow-x-auto hide-scrollbar pb-2">
                <div className="flex gap-2 min-w-max">
                  <button
                    onClick={() => setInput("Show me my resume")}
                    className="px-4 py-2 rounded-full bg-background/95 backdrop-blur-xl border border-border/50 text-sm hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap shadow-lg"
                  >
                    📄 Show resume
                  </button>
                  <button
                    onClick={() => setInput("Analyze my CV score")}
                    className="px-4 py-2 rounded-full bg-background/95 backdrop-blur-xl border border-border/50 text-sm hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap shadow-lg"
                  >
                    ⚡ Analyze CV
                  </button>
                  <button
                    onClick={() => setInput("Find jobs for me")}
                    className="px-4 py-2 rounded-full bg-background/95 backdrop-blur-xl border border-border/50 text-sm hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap shadow-lg"
                  >
                    🔍 Find jobs
                  </button>
                  <button
                    onClick={() => setInput("Start auto-applying to jobs")}
                    className="px-4 py-2 rounded-full bg-background/95 backdrop-blur-xl border border-border/50 text-sm hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap shadow-lg"
                  >
                    🤖 Auto-apply
                  </button>
                  <button
                    onClick={() => setInput("Give me a coding challenge")}
                    className="px-4 py-2 rounded-full bg-background/95 backdrop-blur-xl border border-border/50 text-sm hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap shadow-lg"
                  >
                    💻 Code challenge
                  </button>
                  <button
                    onClick={() => setInput("Practice interview")}
                    className="px-4 py-2 rounded-full bg-background/95 backdrop-blur-xl border border-border/50 text-sm hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap shadow-lg"
                  >
                    🎤 Mock interview
                  </button>
                  <button
                    onClick={() => setInput("Learn new skills")}
                    className="px-4 py-2 rounded-full bg-background/95 backdrop-blur-xl border border-border/50 text-sm hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap shadow-lg"
                  >
                    📚 Learn
                  </button>
                  <button
                    onClick={() => setInput("Explore opportunities")}
                    className="px-4 py-2 rounded-full bg-background/95 backdrop-blur-xl border border-border/50 text-sm hover:border-primary/50 hover:bg-primary/5 transition-all whitespace-nowrap shadow-lg"
                  >
                    🌟 Explore
                  </button>
                </div>
              </div>
            )}
            
            {/* Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-background/95 backdrop-blur-xl rounded-lg px-3 py-2 text-sm border border-border/50 shadow-lg"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative flex items-center gap-2 bg-background/95 backdrop-blur-xl border-2 border-border/50 rounded-3xl p-2 shadow-2xl focus-within:border-primary focus-within:shadow-primary/20 transition-all">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-auto h-9 border-0 bg-muted/50 hover:bg-muted rounded-xl px-3 gap-2 shadow-none focus:ring-0 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                  <SelectItem value="claude-2">Claude 2</SelectItem>
                  <SelectItem value="gemini">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything about your career..."
                className="flex-1 border-0 bg-transparent min-h-[36px] max-h-[200px] px-2 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none overflow-y-auto"
                rows={1}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 200) + 'px';
                }}
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl h-9 w-9 hover:bg-muted"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileAttachment}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl h-9 w-9"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      </div>
      </div>
    </>
  );
};

export default AICareerAssistantChat;