"use client"

import Image from "next/image"
import { DonationWidget } from "@/components/donation/donation-widget"
import { ImpactSection } from "@/components/donation/impact-section"
import { TestimonialsSection } from "@/components/donation/testimonials-section"
import { FaqSection } from "@/components/donation/faq-section"
import { Button } from "@/components/ui/button"
import { FadeIn } from "@/components/donation/animations/fade-in"
import { ScrollReveal } from "@/components/donation/animations/scroll-reveal"
import { motion } from "framer-motion"
import { useEffect } from "react"
import Link from "next/link"

export default function DonationPage() {
  // Add at the beginning of the component
  useEffect(() => {
    // Force a rerender after the page loads to ensure animations trigger properly
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative h-[500px] w-full overflow-hidden">
        <Image
          src="/deepmind-picture-2.jpg?height=1080&width=1920"
          alt="People helping others"
          fill
          className="object-cover brightness-[0.7]"
          priority
        />
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1.0],
            }}
          >
            Make a Difference Today
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-white max-w-2xl mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.25, 0.1, 0.25, 1.0],
            }}
          >
            Your contribution helps us continue our mission and create positive change in the world.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
              ease: [0.25, 0.1, 0.25, 1.0],
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              className="bg-white text-black hover:bg-slate-100"
              onClick={() => {
                const donationElement = document.getElementById("donate")
                if (donationElement) {
                  donationElement.scrollIntoView({ behavior: "smooth" })
                }
              }}
            >
              Donate Now
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Donation Widget */}
          <div id="donate" className="lg:col-span-1 flex justify-center">
            <div className="sticky top-8">
              <FadeIn delay={0.2}>
                <h2 className="text-3xl font-bold text-center mb-6">Support Our Cause</h2>
              </FadeIn>
              <DonationWidget />
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            <div className="prose prose-lg max-w-none">
              <FadeIn delay={0.3}>
                <h2 className="text-3xl font-bold mb-6">Why Your Support Matters</h2>
              </FadeIn>
              <FadeIn delay={0.4}>
                <p className="text-lg text-gray-700 mb-6">
                  Every donation, no matter the size, makes a significant impact on our ability to continue our mission.
                  Your generosity helps us develop and maintain valuable resources that benefit thousands of people
                  worldwide.
                </p>
              </FadeIn>
              <FadeIn delay={0.5}>
                <p className="text-lg text-gray-700 mb-6">With your support, we can:</p>
              </FadeIn>
              <motion.ul
                className="list-disc pl-6 mb-8 text-lg text-gray-700"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.6,
                    },
                  },
                  hidden: {},
                }}
              >
                {[
                  "Continue to provide free access to our tools and resources",
                  "Develop new features and improvements",
                  "Maintain our infrastructure and ensure reliable service",
                  "Expand our reach to help more people",
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    className="mb-2"
                    variants={{
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: {
                          duration: 0.5,
                          ease: [0.25, 0.1, 0.25, 1.0],
                        },
                      },
                      hidden: { opacity: 0, x: -20 },
                    }}
                  >
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <div id="impact-section">
              <ScrollReveal>
                <ImpactSection />
              </ScrollReveal>
            </div>

            <ScrollReveal>
              <TestimonialsSection />
            </ScrollReveal>

            <ScrollReveal>
              <FaqSection />
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn delay={0.1} direction="up">
              <div>
                <h3 className="text-xl font-bold mb-4">About Us</h3>
                <p className="text-slate-300">
                  We're dedicated to making a positive impact through innovative solutions and community support.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2} direction="up">
              <div>
                <h3 className="text-xl font-bold mb-4">Contact</h3>
                <p className="text-slate-300">Email: general@cedzlabs.com</p>
                <Link href={'https://cedzlabs.com/contact'}><p className="text-slate-300">Contact us at cedzlabs </p></Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.3} direction="up">
              <div>
                <h3 className="text-xl font-bold mb-4">Follow Us</h3>
                <div className="flex space-x-4">
                  {[
                    {
                      name: "Twitter",
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
                          className="lucide lucide-twitter"
                        >
                          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                        </svg>
                      ),
                    },
                    {
                      name: "Facebook",
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
                          className="lucide lucide-facebook"
                        >
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                      ),
                    },
                    {
                      name: "Instagram",
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
                          className="lucide lucide-instagram"
                        >
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                      ),
                    },
                  ].map((social, index) => (
                    <motion.a
                      key={index}
                      href="#"
                      className="text-white hover:text-slate-300"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="sr-only">{social.name}</span>
                      {social.icon}
                    </motion.a>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.4} direction="up">
            <div className="mt-8 pt-8 border-t border-slate-800 text-center">
              <p className="text-slate-400">© {new Date().getFullYear()} Your Organization. All rights reserved.</p>
            </div>
          </FadeIn>
        </div>
      </footer>
    </div>
  )
}