"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Update the interface to accept undefined for profilePicture
interface DebugProfileImageProps {
  profilePicture: string | undefined
}

export default function DebugProfileImage({ profilePicture }: DebugProfileImageProps) {
  const [mounted, setMounted] = useState(false)
  const [showDebugData, setShowDebugData] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Don't render anything during SSR
  }

  if (!profilePicture) {
    return <div className="text-xs text-red-500 mt-2">No profile picture available</div>
  }

  return (
    <div className="mt-4 w-full">
      <Button variant="outline" size="sm" onClick={() => setShowDebugData(!showDebugData)} className="text-xs mb-2">
        {showDebugData ? "Hide Debug Info" : "Show Debug Info"}
      </Button>

      {showDebugData && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Profile Picture Data (first 100 chars):</div>
          <Textarea
            value={profilePicture ? profilePicture.substring(0, 100) + "..." : "No image data"}
            readOnly
            rows={3}
            className="text-xs font-mono"
          />
          <div className="text-xs text-muted-foreground">
            Image data length: {profilePicture ? profilePicture.length : 0} characters
          </div>
        </div>
      )}
    </div>
  )
}