"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from 'zod/v3';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  AlertCircle,
  CheckCircle2,
  Send,
  HelpCircle,
  Lightbulb,
  FileText,
  Mail,
  Sparkles,
  LayoutTemplate,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { faqData, suggestionData } from "@/lib/faq"

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  type: z.enum(["feedback", "feature", "other"], {
    required_error: "Please select a feedback type",
  }),
  service: z.enum(["cv", "coverletter", "ai"], {
    required_error: "Please select a service",
  }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
})

type FormData = z.infer<typeof formSchema>

export default function FeedbackPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      type: undefined,
      service: undefined,
      message: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      setSubmitSuccess(true)
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      })
      reset()

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      setSubmitError("There was an error submitting your feedback. Please try again.")
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to render suggestion cards
  const renderSuggestionIcon = (iconName: string) => {
    switch (iconName) {
      case "FileText":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "Mail":
        return <Mail className="h-5 w-5 text-green-500" />
      case "Sparkles":
        return <Sparkles className="h-5 w-5 text-purple-500" />
      case "LayoutTemplate":
        return <LayoutTemplate className="h-5 w-5 text-orange-500" />
      default:
        return <Lightbulb className="h-5 w-5 text-yellow-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">We Value Your Feedback</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Help us improve our resume and cover letter generator by sharing your thoughts, reporting bugs, or
            suggesting new features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Feedback Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="text-2xl font-bold text-primary">Feedback Form</CardTitle>
                  <CardDescription>
                    Share your experience and help us make our tools better for everyone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-400">Success!</AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-300">
                          Your feedback has been submitted successfully. Thank you for helping us improve!
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6"
                    >
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{submitError}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" {...register("name")} className="mt-1" />
                          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" {...register("email")} className="mt-1" />
                          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label>Feedback Type</Label>
                          <RadioGroup
                            className="mt-2"
                            defaultValue={watch("type")}
                            onValueChange={(value) => setValue("type", value as "feedback" | "feature" | "other")}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="feedback" id="feedback" />
                              <Label htmlFor="feedback" className="cursor-pointer">
                                Feedback
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="feature" id="feature" />
                              <Label htmlFor="feature" className="cursor-pointer">
                                Feature Request
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="other" id="other" />
                              <Label htmlFor="other" className="cursor-pointer">
                                Other
                              </Label>
                            </div>
                          </RadioGroup>
                          {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>}
                        </div>

                        <div>
                          <Label>Service</Label>
                          <RadioGroup
                            className="mt-2"
                            defaultValue={watch("service")}
                            onValueChange={(value) => setValue("service", value as "cv" | "coverletter" | "ai")}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cv" id="cv" />
                              <Label htmlFor="cv" className="cursor-pointer">
                                Resume/CV
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="coverletter" id="coverletter" />
                              <Label htmlFor="coverletter" className="cursor-pointer">
                                Cover Letter
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ai" id="ai" />
                              <Label htmlFor="ai" className="cursor-pointer">
                                AI Assistant
                              </Label>
                            </div>
                          </RadioGroup>
                          {errors.service && <p className="text-sm text-red-500 mt-1">{errors.service.message}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          {...register("message")}
                          className="mt-1"
                          rows={5}
                          placeholder="Please describe your feedback, bug report, or feature request in detail..."
                        />
                        {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Send className="mr-2 h-4 w-4" />
                          Submit Feedback
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Suggestions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8"
            >
              <h2 className="text-2xl font-bold text-primary mb-4">Helpful Tips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestionData.map((suggestion, index) => (
                  <Card key={index} className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="pb-2 flex flex-row items-center gap-2">
                      {renderSuggestionIcon(suggestion.icon)}
                      <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - FAQ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="shadow-lg h-full">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>Find answers to common questions about our tools</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-2">
                <Accordion type="single" collapsible className="w-full">
                  {faqData.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 flex justify-center py-4">
                <p className="text-sm text-muted-foreground text-center">
                  Can't find what you're looking for? <br />
                  Submit your question using the feedback form.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}