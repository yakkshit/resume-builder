"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FadeIn } from "@/components/donation/animations/fade-in"
import { motion, AnimatePresence } from "framer-motion"

export function FaqSection() {
  const faqs = [
    {
      question: "How is my donation used?",
      answer:
        "Your donation directly supports our operations, development of new features, and maintaining our infrastructure. We strive to be transparent about how funds are allocated, with the majority going directly to improving our services.",
    },
    {
      question: "Is my donation tax-deductible?",
      answer:
        "Depending on your location, your donation may be tax-deductible. We recommend consulting with a tax professional for advice specific to your situation. We can provide donation receipts upon request.",
    },
    {
      question: "Can I make a recurring donation?",
      answer:
        "Yes! On the payment page, you'll have the option to set up a recurring donation on a monthly or annual basis. Recurring donations help us plan for the future and ensure sustainable operations.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept major credit cards, PayPal, and bank transfers. If you prefer an alternative payment method, please contact us directly and we'll do our best to accommodate your preference.",
    },
    {
      question: "How secure is my payment information?",
      answer:
        "We take security very seriously. All payments are processed through secure, encrypted connections. We do not store your payment information on our servers.",
    },
  ]

  return (
    <section className="my-16">
      <FadeIn>
        <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
      </FadeIn>

      <Accordion type="single" collapsible className="w-full">
        <AnimatePresence>
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{
                opacity: 1,
                y: 0,
                transition: {
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1.0],
                },
              }}
              viewport={{ once: true }}
            >
              <AccordionItem value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <motion.p
                    className="text-slate-700"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {faq.answer}
                  </motion.p>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </Accordion>
    </section>
  )
}