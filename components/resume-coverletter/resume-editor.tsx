"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { ResumeData, PortfolioLink } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, Trash2, Upload, X, LinkIcon, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DebugProfileImage from "./debug-profile-image"


interface ResumeEditorProps {
  resumeData: ResumeData
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>
}

function SortableItem({ id, children }: { id: string | number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 mb-4 group">
      <div
        {...attributes}
        {...listeners}
        className="mt-4 cursor-grab text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={20} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default function ResumeEditor({ resumeData, setResumeData }: ResumeEditorProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent, section: string) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setResumeData((prev) => {
        const list = prev[section as keyof ResumeData] || prev.basicInfo[section as keyof typeof prev.basicInfo]
        if (!Array.isArray(list)) return prev

        const oldIndex = list.findIndex((item: any) => (item.id || JSON.stringify(item)) === active.id)
        const newIndex = list.findIndex((item: any) => (item.id || JSON.stringify(item)) === over?.id)

        // For arrays of strings (skills, languages) or objects without IDs, we need a stable ID strategy.
        // However, dnd-kit needs stable IDs.
        // If items don't have IDs, using index as ID is problematic for sorting.
        // But here we are using the item itself or stringify as ID for finding index.
        // Let's assume we pass the index as ID to SortableItem for simplicity if no ID exists,
        // but that causes issues if content changes.
        // A better approach for this editor is to use the index as the ID for the SortableItem,
        // but that is also discouraged.
        // Let's use a combination of content and index or just index if we accept re-rendering.
        // Actually, let's use the index as ID for now as it's the most straightforward without adding IDs to data.

        // Wait, if I use index as ID, arrayMove will use indices.
        // active.id and over.id will be indices.

        const oldIdx = active.id as number
        const newIdx = over?.id as number

        let newData = { ...prev }

        if (section === "experience" || section === "education" || section === "projects" || section === "achievements") {
          // @ts-ignore
          newData[section] = arrayMove(list, oldIdx, newIdx)
        } else if (section === "skills") {
          // @ts-ignore
          newData.skills = arrayMove(list, oldIdx, newIdx)
        } else if (section === "languages" || section === "portfolioLinks") {
          // @ts-ignore
          newData.basicInfo[section] = arrayMove(list, oldIdx, newIdx)
        }

        return newData
      })
    }
  }

  // Check if profile picture is loaded on component mount
  useEffect(() => {
    if (resumeData.basicInfo.profilePicture) {
      setImageLoaded(true)
    }
  }, [resumeData.basicInfo.profilePicture])

  const updateBasicInfo = (field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        [field]: value,
      },
    }))
  }

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Profile picture must be less than 2MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const profilePicture = event.target.result as string

        // Update the profile picture in resumeData
        setResumeData((prev) => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            profilePicture: profilePicture,
          },
        }))

        console.log("Profile picture updated:", profilePicture.substring(0, 50) + "...")
        setImageLoaded(true)

        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully",
        })

        // Show debug tools
        setShowDebug(true)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeProfilePicture = () => {
    updateBasicInfo("profilePicture", "")
    setImageLoaded(false)
    toast({
      title: "Profile picture removed",
      description: "Your profile picture has been removed",
    })
    setShowDebug(false)
  }

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          description: "",
          highlights: [],
        },
      ],
    }))
  }

  const updateExperience = (index: number, field: string, value: string) => {
    setResumeData((prev) => {
      const updatedExperience = [...prev.experience]
      updatedExperience[index] = {
        ...updatedExperience[index],
        [field]: value,
      }
      return {
        ...prev,
        experience: updatedExperience,
      }
    })
  }

  const removeExperience = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }))
  }

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          institution: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          gpa: "",
        },
      ],
    }))
  }

  const updateEducation = (index: number, field: string, value: string) => {
    setResumeData((prev) => {
      const updatedEducation = [...prev.education]
      updatedEducation[index] = {
        ...updatedEducation[index],
        [field]: value,
      }
      return {
        ...prev,
        education: updatedEducation,
      }
    })
  }

  const removeEducation = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const addSkill = () => {
    setResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, ""],
    }))
  }

  const updateSkill = (index: number, value: string) => {
    setResumeData((prev) => {
      const updatedSkills = [...prev.skills]
      updatedSkills[index] = value
      return {
        ...prev,
        skills: updatedSkills,
      }
    })
  }

  const removeSkill = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }))
  }

  // Languages
  const addLanguage = () => {
    setResumeData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        languages: [...(prev.basicInfo.languages || []), ""],
      },
    }))
  }

  const updateLanguage = (index: number, value: string) => {
    setResumeData((prev) => {
      const updatedLanguages = [...(prev.basicInfo.languages || [])]
      updatedLanguages[index] = value
      return {
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          languages: updatedLanguages,
        },
      }
    })
  }

  const removeLanguage = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        languages: (prev.basicInfo.languages || []).filter((_, i) => i !== index),
      },
    }))
  }

  // Portfolio Links
  const addPortfolioLink = () => {
    setResumeData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        portfolioLinks: [
          ...(prev.basicInfo.portfolioLinks || []),
          {
            platform: "",
            url: "",
            username: "",
          },
        ],
      },
    }))
  }

  const updatePortfolioLink = (index: number, field: keyof PortfolioLink, value: string) => {
    setResumeData((prev) => {
      const updatedLinks = [...(prev.basicInfo.portfolioLinks || [])]
      updatedLinks[index] = {
        ...updatedLinks[index],
        [field]: value,
      }
      return {
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          portfolioLinks: updatedLinks,
        },
      }
    })
  }

  const removePortfolioLink = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        portfolioLinks: (prev.basicInfo.portfolioLinks || []).filter((_, i) => i !== index),
      },
    }))
  }

  // Projects
  const addProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        {
          name: "",
          description: "",
          technologies: [""],
          link: "",
          startDate: "",
          endDate: "",
        },
      ],
    }))
  }

  const updateProject = (index: number, field: string, value: string) => {
    setResumeData((prev) => {
      const updatedProjects = [...(prev.projects || [])]
      updatedProjects[index] = {
        ...updatedProjects[index],
        [field]: value,
      }
      return {
        ...prev,
        projects: updatedProjects,
      }
    })
  }

  const removeProject = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index),
    }))
  }

  const addProjectTechnology = (projectIndex: number) => {
    setResumeData((prev) => {
      const updatedProjects = [...(prev.projects || [])]
      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        technologies: [...updatedProjects[projectIndex].technologies, ""],
      }
      return {
        ...prev,
        projects: updatedProjects,
      }
    })
  }

  const updateProjectTechnology = (projectIndex: number, techIndex: number, value: string) => {
    setResumeData((prev) => {
      const updatedProjects = [...(prev.projects || [])]
      const updatedTechnologies = [...updatedProjects[projectIndex].technologies]
      updatedTechnologies[techIndex] = value
      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        technologies: updatedTechnologies,
      }
      return {
        ...prev,
        projects: updatedProjects,
      }
    })
  }

  const removeProjectTechnology = (projectIndex: number, techIndex: number) => {
    setResumeData((prev) => {
      const updatedProjects = [...(prev.projects || [])]
      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        technologies: updatedProjects[projectIndex].technologies.filter((_, i) => i !== techIndex),
      }
      return {
        ...prev,
        projects: updatedProjects,
      }
    })
  }

  // Achievements
  const addAchievement = () => {
    setResumeData((prev) => ({
      ...prev,
      achievements: [
        ...(prev.achievements || []),
        {
          title: "",
          description: "",
          date: "",
        },
      ],
    }))
  }

  const updateAchievement = (index: number, field: string, value: string) => {
    setResumeData((prev) => {
      const updatedAchievements = [...(prev.achievements || [])]
      updatedAchievements[index] = {
        ...updatedAchievements[index],
        [field]: value,
      }
      return {
        ...prev,
        achievements: updatedAchievements,
      }
    })
  }

  const removeAchievement = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, i) => i !== index),
    }))
  }

  // Common platform options for portfolio links
  const platformOptions = [
    "GitHub",
    "GitLab",
    "Bitbucket",
    "Dribbble",
    "Behance",
    "Figma",
    "CodePen",
    "Stack Overflow",
    "Medium",
    "Dev.to",
    "Personal Blog",
    "Portfolio",
    "Other",
  ]

  // Add a function to sync the resume data with the PDF viewer
  useEffect(() => {
    // Log when resume data changes to help with debugging
    console.log("Resume data updated in editor:", resumeData)

    // This effect will run whenever resumeData changes
    // The parent component (app/page.tsx) already handles saving to localStorage
  }, [resumeData])

  return (
    <div className="space-y-6 overflow-y-auto max-h-[800px] pr-2">
      <Accordion type="single" collapsible defaultValue="basic-info">
        <AccordionItem value="basic-info">
          <AccordionTrigger>Basic Information</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="relative mb-2">
                  <Avatar className="w-24 h-24">
                    <AvatarImage
                      src={resumeData.basicInfo.profilePicture}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        console.error("Error loading profile image")
                        setImageLoaded(false)
                      }}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {resumeData.basicInfo.name ? resumeData.basicInfo.name.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>

                  {resumeData.basicInfo.profilePicture && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removeProfilePicture}
                    >
                      <X size={12} />
                    </Button>
                  )}
                </div>

                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">
                  <Upload size={14} className="mr-1" />
                  {resumeData.basicInfo.profilePicture ? "Change Photo" : "Upload Photo"}
                </Button>

                {imageLoaded && <div className="mt-1 text-xs text-green-600">Image loaded successfully</div>}

                {showDebug && <DebugProfileImage profilePicture={resumeData.basicInfo.profilePicture} />}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input value={resumeData.basicInfo.name} onChange={(e) => updateBasicInfo("name", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={resumeData.basicInfo.title}
                    onChange={(e) => updateBasicInfo("title", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={resumeData.basicInfo.email}
                  onChange={(e) => updateBasicInfo("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  value={resumeData.basicInfo.phone}
                  onChange={(e) => updateBasicInfo("phone", e.target.value)}
                  placeholder="(123) 456-7890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input
                  value={resumeData.basicInfo.location}
                  onChange={(e) => updateBasicInfo("location", e.target.value)}
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">LinkedIn Username</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">linkedin.com/in/</span>
                  <Input
                    value={resumeData.basicInfo.linkedin}
                    onChange={(e) => updateBasicInfo("linkedin", e.target.value)}
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <Input
                  value={resumeData.basicInfo.website}
                  onChange={(e) => updateBasicInfo("website", e.target.value)}
                  placeholder="yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Summary</label>
                <Textarea
                  value={resumeData.basicInfo.summary}
                  onChange={(e) => updateBasicInfo("summary", e.target.value)}
                  rows={4}
                  placeholder="A brief summary of your professional background and goals"
                />
              </div>

              {/* Portfolio Links */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Portfolio Links</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPortfolioLink}
                    className="h-7 text-xs flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add Link
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => handleDragEnd(event, "portfolioLinks")}
                >
                  <SortableContext
                    items={resumeData.basicInfo.portfolioLinks?.map((_, i) => i) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {resumeData.basicInfo.portfolioLinks?.map((link, index) => (
                      <SortableItem key={index} id={index}>
                        <div className="p-3 border rounded-md relative bg-background">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 text-destructive"
                            onClick={() => removePortfolioLink(index)}
                          >
                            <Trash2 size={14} />
                          </Button>

                          <div className="grid grid-cols-1 gap-3 mb-2">
                            <div>
                              <label className="block text-xs font-medium mb-1">Platform</label>
                              <Select
                                value={link.platform}
                                onValueChange={(value) => updatePortfolioLink(index, "platform", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                  {platformOptions.map((platform) => (
                                    <SelectItem key={platform} value={platform}>
                                      {platform}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium mb-1">Username</label>
                              <Input
                                value={link.username || ""}
                                onChange={(e) => updatePortfolioLink(index, "username", e.target.value)}
                                placeholder="Your username"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium mb-1">URL</label>
                              <div className="flex items-center gap-2">
                                <LinkIcon size={14} className="text-muted-foreground" />
                                <Input
                                  value={link.url}
                                  onChange={(e) => updatePortfolioLink(index, "url", e.target.value)}
                                  placeholder="https://example.com/username"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* The rest of your Accordion items remain unchanged */}

        {/* Experience */}
        <AccordionItem value="experience">
          <AccordionTrigger>Experience</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {isMounted ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => handleDragEnd(event, "experience")}
                >
                  <SortableContext
                    items={resumeData.experience.map((_, i) => i) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {resumeData.experience.map((exp, index) => (
                      <SortableItem key={index} id={index}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 border rounded-lg relative bg-background"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => removeExperience(index)}
                          >
                            <Trash2 size={16} />
                          </Button>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Company</label>
                              <Input
                                value={exp.company}
                                onChange={(e) => updateExperience(index, "company", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Role</label>
                              <Input value={exp.position} onChange={(e) => updateExperience(index, "position", e.target.value)} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Start Date</label>
                              <Input
                                value={exp.startDate}
                                onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                                placeholder="MM/YYYY"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">End Date</label>
                              <Input
                                value={exp.endDate}
                                onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                                placeholder="MM/YYYY or Present"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(index, "description", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </motion.div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-6">
                  {resumeData.experience.map((exp, index) => (
                    <div key={index} className="p-4 border rounded-lg relative bg-background">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive"
                        onClick={() => removeExperience(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Company</label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateExperience(index, "company", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Role</label>
                          <Input value={exp.position} onChange={(e) => updateExperience(index, "position", e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date</label>
                          <Input
                            value={exp.startDate}
                            onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <Input
                            value={exp.endDate}
                            onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                            placeholder="MM/YYYY or Present"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(index, "description", e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                onClick={addExperience}
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Experience
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="education">
          <AccordionTrigger>Education</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {isMounted ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => handleDragEnd(event, "education")}
                >
                  <SortableContext
                    items={resumeData.education.map((_, i) => i) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {resumeData.education.map((edu, index) => (
                      <SortableItem key={index} id={index}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 border rounded-lg relative bg-background"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => removeEducation(index)}
                          >
                            <Trash2 size={16} />
                          </Button>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Institution</label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => updateEducation(index, "institution", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Degree</label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => updateEducation(index, "degree", e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Field of Study</label>
                            <Input value={edu.field} onChange={(e) => updateEducation(index, "field", e.target.value)} />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Start Date</label>
                              <Input
                                value={edu.startDate}
                                onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                                placeholder="MM/YYYY"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">End Date</label>
                              <Input
                                value={edu.endDate}
                                onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                                placeholder="MM/YYYY or Present"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">GPA</label>
                              <Input value={edu.gpa} onChange={(e) => updateEducation(index, "gpa", e.target.value)} />
                            </div>
                          </div>
                        </motion.div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-6">
                  {resumeData.education.map((edu, index) => (
                    <div key={index} className="p-4 border rounded-lg relative bg-background">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive"
                        onClick={() => removeEducation(index)}
                      >
                        <Trash2 size={16} />
                      </Button>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Institution</label>
                          <Input
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, "institution", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Degree</label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, "degree", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Field of Study</label>
                        <Input value={edu.field} onChange={(e) => updateEducation(index, "field", e.target.value)} />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date</label>
                          <Input
                            value={edu.startDate}
                            onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <Input
                            value={edu.endDate}
                            onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                            placeholder="MM/YYYY or Present"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">GPA</label>
                          <Input value={edu.gpa} onChange={(e) => updateEducation(index, "gpa", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                onClick={addEducation}
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Education
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skills">
          <AccordionTrigger>Skills</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {isMounted ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => handleDragEnd(event, "skills")}
                >
                  <SortableContext items={resumeData.skills.map((_, i) => i) || []} strategy={verticalListSortingStrategy}>
                    {resumeData.skills.map((skill, index) => (
                      <SortableItem key={index} id={index}>
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={skill}
                            onChange={(e) => updateSkill(index, e.target.value)}
                            placeholder="e.g., JavaScript, Project Management, etc."
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive shrink-0"
                            onClick={() => removeSkill(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-4">
                  {resumeData.skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={skill}
                        onChange={(e) => updateSkill(index, e.target.value)}
                        placeholder="e.g., JavaScript, Project Management, etc."
                      />
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeSkill(index)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" onClick={addSkill} className="w-full flex items-center justify-center gap-2">
                <Plus size={16} />
                Add Skill
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="projects">
          <AccordionTrigger>Projects</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {isMounted ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => handleDragEnd(event, "projects")}
                >
                  <SortableContext
                    items={resumeData.projects?.map((_, i) => i) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {resumeData.projects?.map((project, index) => (
                      <SortableItem key={index} id={index}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 border rounded-lg relative bg-background"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => removeProject(index)}
                          >
                            <Trash2 size={16} />
                          </Button>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Project Name</label>
                              <Input value={project.name} onChange={(e) => updateProject(index, "name", e.target.value)} />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Project Link (Optional)</label>
                              <Input
                                value={project.link || ""}
                                onChange={(e) => updateProject(index, "link", e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Start Date (Optional)</label>
                              <Input
                                value={project.startDate || ""}
                                onChange={(e) => updateProject(index, "startDate", e.target.value)}
                                placeholder="MM/YYYY"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                              <Input
                                value={project.endDate || ""}
                                onChange={(e) => updateProject(index, "endDate", e.target.value)}
                                placeholder="MM/YYYY or Present"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <Textarea
                              value={project.description}
                              onChange={(e) => updateProject(index, "description", e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Technologies</label>
                            <div className="space-y-2">
                              {project.technologies.map((tech, techIndex) => (
                                <div key={techIndex} className="flex items-center gap-2">
                                  <Input
                                    value={tech}
                                    onChange={(e) => updateProjectTechnology(index, techIndex, e.target.value)}
                                    placeholder="e.g., React, Node.js, etc."
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => removeProjectTechnology(index, techIndex)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                onClick={() => addProjectTechnology(index)}
                                className="w-full flex items-center justify-center gap-2"
                              >
                                <Plus size={16} />
                                Add Technology
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-6">
                  {resumeData.projects?.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 border rounded-lg relative bg-background"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive"
                        onClick={() => removeProject(index)}
                      >
                        <Trash2 size={16} />
                      </Button>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Project Name</label>
                          <Input value={project.name} onChange={(e) => updateProject(index, "name", e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Project Link (Optional)</label>
                          <Input
                            value={project.link || ""}
                            onChange={(e) => updateProject(index, "link", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Start Date (Optional)</label>
                          <Input
                            value={project.startDate || ""}
                            onChange={(e) => updateProject(index, "startDate", e.target.value)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                          <Input
                            value={project.endDate || ""}
                            onChange={(e) => updateProject(index, "endDate", e.target.value)}
                            placeholder="MM/YYYY or Present"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={project.description}
                          onChange={(e) => updateProject(index, "description", e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Technologies</label>
                        <div className="space-y-2">
                          {project.technologies.map((tech, techIndex) => (
                            <div key={techIndex} className="flex items-center gap-2">
                              <Input
                                value={tech}
                                onChange={(e) => updateProjectTechnology(index, techIndex, e.target.value)}
                                placeholder="e.g., React, Node.js, etc."
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => removeProjectTechnology(index, techIndex)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            onClick={() => addProjectTechnology(index)}
                            className="w-full flex items-center justify-center gap-2"
                          >
                            <Plus size={16} />
                            Add Technology
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <Button variant="outline" onClick={addProject} className="w-full flex items-center justify-center gap-2">
                <Plus size={16} />
                Add Project
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="achievements">
          <AccordionTrigger>Achievements</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {isMounted ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => handleDragEnd(event, "achievements")}
                >
                  <SortableContext
                    items={resumeData.achievements?.map((_, i) => i) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {resumeData.achievements?.map((achievement, index) => (
                      <SortableItem key={index} id={index}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 border rounded-lg relative bg-background"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => removeAchievement(index)}
                          >
                            <Trash2 size={16} />
                          </Button>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Title</label>
                              <Input
                                value={achievement.title}
                                onChange={(e) => updateAchievement(index, "title", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Date (Optional)</label>
                              <Input
                                value={achievement.date || ""}
                                onChange={(e) => updateAchievement(index, "date", e.target.value)}
                                placeholder="YYYY or YYYY-Present"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <Textarea
                              value={achievement.description}
                              onChange={(e) => updateAchievement(index, "description", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </motion.div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-6">
                  {resumeData.achievements?.map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 border rounded-lg relative bg-background"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive"
                        onClick={() => removeAchievement(index)}
                      >
                        <Trash2 size={16} />
                      </Button>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Title</label>
                          <Input
                            value={achievement.title}
                            onChange={(e) => updateAchievement(index, "title", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Date (Optional)</label>
                          <Input
                            value={achievement.date || ""}
                            onChange={(e) => updateAchievement(index, "date", e.target.value)}
                            placeholder="YYYY or YYYY-Present"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={achievement.description}
                          onChange={(e) => updateAchievement(index, "description", e.target.value)}
                          rows={3}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                onClick={addAchievement}
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Achievement
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="languages">
          <AccordionTrigger>Languages</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {isMounted ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => handleDragEnd(event, "languages")}
                >
                  <SortableContext
                    items={resumeData.basicInfo.languages?.map((_, i) => i) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {resumeData.basicInfo.languages?.map((language, index) => (
                      <SortableItem key={index} id={index}>
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={language}
                            onChange={(e) => updateLanguage(index, e.target.value)}
                            placeholder="e.g., English (Native), Spanish (Fluent)"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive shrink-0"
                            onClick={() => removeLanguage(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-4">
                  {resumeData.basicInfo.languages?.map((language, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={language}
                        onChange={(e) => updateLanguage(index, e.target.value)}
                        placeholder="e.g., English (Native), Spanish (Fluent)"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeLanguage(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" onClick={addLanguage} className="w-full flex items-center justify-center gap-2">
                <Plus size={16} />
                Add Language
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}