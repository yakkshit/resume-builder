import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StaggerContainer, StaggerItem } from "@/components/donation/animations/stagger-children"
import { CountUp } from "@/components/donation/animations/count-up"
import { FadeIn } from "@/components/donation/animations/fade-in"
import { HoverCard } from "@/components/donation/animations/hover-card"

export function ImpactSection() {
  const impacts = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-users mr-2"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      value: 10000,
      suffix: "+",
      label: "People helped",
      description: "We've helped thousands of people achieve their goals through our tools and resources.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-globe mr-2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      ),
      value: 50,
      suffix: "+",
      label: "Countries reached",
      description: "Our services have reached people in over 50 countries around the world.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-calendar-days mr-2"
        >
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
          <path d="M8 18h.01" />
          <path d="M12 18h.01" />
          <path d="M16 18h.01" />
        </svg>
      ),
      value: 5,
      label: "Years of service",
      description: "We've been dedicated to our mission for 5 years and continue to grow.",
    },
  ]

  return (
    <section className="my-16">
      <FadeIn>
        <h2 className="text-3xl font-bold mb-8">Our Impact</h2>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {impacts.map((impact, index) => (
          <StaggerItem key={index}>
            <HoverCard>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {impact.icon}
                    <CountUp
                      end={impact.value}
                      suffix={impact.suffix || ""}
                      duration={2.5}
                      className="text-xl font-bold"
                    />
                  </CardTitle>
                  <CardDescription>{impact.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{impact.description}</p>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  )
}