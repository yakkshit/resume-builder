"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { CoverLetterData, CoverLetterTemplate } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { GradientCoverLetterTemplate } from "../pdf-templates/coverletter/gradient-cover-letter-template"
import { ProfessionalCoverLetterTemplate } from "../pdf-templates/coverletter/professional-cover-letter-template"
import { ElegantCoverLetterTemplate } from "../pdf-templates/coverletter/elegant-cover-letter-template"
import { DarkCoverLetterTemplate } from "../pdf-templates/coverletter/dark-cover-letter-template"

interface CoverLetterPreviewProps {
  coverLetterData: CoverLetterData
  template: CoverLetterTemplate
}

export default function CoverLetterPreview({ coverLetterData, template }: CoverLetterPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // When template changes, briefly show loading state
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [template])

  if (!mounted) {
    return <div className="min-h-[800px] flex items-center justify-center">Loading preview...</div>
  }

  const renderTemplate = () => {
    switch (template) {
      case "modern":
        return <ModernTemplate coverLetterData={coverLetterData} />
      case "creative":
        return <CreativeTemplate coverLetterData={coverLetterData} />
      case "standard":
        return <StandardTemplate coverLetterData={coverLetterData} />
      case "professional":
        return <ProfessionalCoverLetterTemplate coverLetterData={coverLetterData}  />
      case "elegant":
        return <ElegantCoverLetterTemplate coverLetterData={coverLetterData}  />
      case "dark":
        return <DarkCoverLetterTemplate coverLetterData={coverLetterData}  />
      case "gradient":
        return <GradientCoverLetterTemplate coverLetterData={coverLetterData} />
      default:
        return <StandardTemplate coverLetterData={coverLetterData} />
    }
  }

  return (
    <Card className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden h-[800px] shadow-md">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div
          key={template}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full overflow-auto p-6"
        >
          {renderTemplate()}
        </motion.div>
      )}
    </Card>
  )
}

function StandardTemplate({ coverLetterData }: { coverLetterData: CoverLetterData }) {
  return (
    <div className="font-serif max-w-[800px] mx-auto space-y-6 text-gray-800 dark:text-gray-200">
      <div className="whitespace-pre-line">{coverLetterData.head}</div>
      <div className="whitespace-pre-line">{coverLetterData.body}</div>
      <div className="whitespace-pre-line">{coverLetterData.footer}</div>
    </div>
  )
}

function ModernTemplate({ coverLetterData }: { coverLetterData: CoverLetterData }) {
  return (
    <div className="font-sans max-w-[800px] mx-auto space-y-6 text-gray-800 dark:text-gray-200">
      <div className="border-b-2 border-primary pb-4 whitespace-pre-line">{coverLetterData.head}</div>
      <div className="whitespace-pre-line">{coverLetterData.body}</div>
      <div className="border-t-2 border-primary pt-4 whitespace-pre-line">{coverLetterData.footer}</div>
    </div>
  )
}

function CreativeTemplate({ coverLetterData }: { coverLetterData: CoverLetterData }) {
  return (
    <div className="font-sans max-w-[800px] mx-auto space-y-6 text-gray-800 dark:text-gray-200">
      <div className="bg-primary/10 p-4 rounded-lg whitespace-pre-line">{coverLetterData.head}</div>
      <div className="whitespace-pre-line">{coverLetterData.body}</div>
      <div className="bg-primary/10 p-4 rounded-lg whitespace-pre-line">{coverLetterData.footer}</div>
    </div>
  )
}