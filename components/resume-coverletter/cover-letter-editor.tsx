"use client"

import type React from "react"
import type { CoverLetterData } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"

interface CoverLetterEditorProps {
  coverLetterData: CoverLetterData
  setCoverLetterData: React.Dispatch<React.SetStateAction<CoverLetterData>>
}

export default function CoverLetterEditor({ coverLetterData, setCoverLetterData }: CoverLetterEditorProps) {
  const updateSection = (section: keyof CoverLetterData, value: string) => {
    setCoverLetterData((prev) => ({
      ...prev,
      [section]: value,
    }))
  }

  return (
    <div className="space-y-6 overflow-y-auto max-h-[800px] pr-2">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Header</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={coverLetterData.head}
              onChange={(e) => updateSection("head", e.target.value)}
              rows={10}
              placeholder="Enter your cover letter header..."
              className="resize-none"
            />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Body</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={coverLetterData.body}
              onChange={(e) => updateSection("body", e.target.value)}
              rows={15}
              placeholder="Enter your cover letter body..."
              className="resize-none"
            />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Footer</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={coverLetterData.footer}
              onChange={(e) => updateSection("footer", e.target.value)}
              rows={8}
              placeholder="Enter your cover letter footer..."
              className="resize-none"
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}