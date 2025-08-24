import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { StaggerContainer, StaggerItem } from "@/components/donation/animations/stagger-children"
import { FadeIn } from "@/components/donation/animations/fade-in"
import { HoverCard } from "@/components/donation/animations/hover-card"

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "This service has been life-changing for me. The tools provided helped me secure my dream job!",
      author: "Sarah J.",
      role: "Marketing Professional",
    },
    {
      quote: "I've recommended this to all my friends. The quality and impact of their work is outstanding.",
      author: "Michael T.",
      role: "Software Engineer",
    },
    {
      quote: "The support I received was incredible. This organization truly cares about making a difference.",
      author: "Elena R.",
      role: "Recent Graduate",
    },
  ]

  return (
    <section className="my-16">
      <FadeIn>
        <h2 className="text-3xl font-bold mb-8">What People Say</h2>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <StaggerItem key={index}>
            <HoverCard>
              <Card className="bg-slate-50">
                <CardContent className="pt-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-quote text-slate-300 mb-4"
                  >
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                  </svg>
                  <p className="italic text-slate-700">{testimonial.quote}</p>
                </CardContent>
                <CardFooter className="flex flex-col items-start">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </CardFooter>
              </Card>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}