"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Cookie } from "lucide-react"

const CONSENT_KEY = "cookie-consent-accepted"

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    const accepted = localStorage.getItem(CONSENT_KEY)
    setShowBanner(!accepted)
  }, [])

  const handleAccept = () => {
    if (typeof window === "undefined") return
    localStorage.setItem(CONSENT_KEY, "true")
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
    >
      <Card className="w-full max-w-lg shadow-2xl border-2">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex items-center gap-2 text-primary">
            <Cookie className="h-6 w-6" />
            <h2 id="cookie-banner-title" className="text-xl font-semibold">
              Cookie & Privacy Notice
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            We use cookies and similar technologies to provide a better experience, analyze usage,
            and personalize content. By continuing, you agree to our use of cookies.
          </p>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This site uses:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Essential cookies for core functionality (e.g., saving your preferences)</li>
            <li>Analytics to help us improve the service</li>
            <li>Local storage for your resume data and settings</li>
          </ul>
          <p>
            You must accept to use this website. Your data stays in your browser and is not shared
            without your consent or sold to third parties it will be used for analytics and to improve the service and you are directly allowing the ai models to access your data.
          </p>
        </CardContent>
        <CardFooter className="pt-2">
          <Button
            onClick={handleAccept}
            size="lg"
            className="w-full sm:w-auto"
            aria-label="Accept cookies and continue"
          >
            I Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
