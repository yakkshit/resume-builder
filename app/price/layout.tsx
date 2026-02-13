import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'AI-Powered Resume Generator',
  description: 'Create, customize, and optimize your resume with AI assistance',
  generator: 'yakkshit.com',
  openGraph: {
    title: 'AI-Powered Resume Generator',
    description: 'Create, customize, and optimize your resume with AI assistance',
    url: 'https://yakkshit.com',
    images: [
      {
        url: './logo.png',
        width: 800,
        height: 600,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Powered Resume Generator',
    description: 'Create, customize, and optimize your resume with AI assistance',
    images: ['./logo.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}