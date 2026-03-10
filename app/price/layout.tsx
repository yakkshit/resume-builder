import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - AI Resume Generator',
  description: 'AI-Powered Resume Generator - Pricing plans',
  generator: 'yakkshit.com',
}

export default function PriceLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}