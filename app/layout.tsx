import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/resume-coverletter/theme-provider'
import { AppNav } from '@/components/app-nav'
import CookieBanner from '@/components/cookie-banner'

export const metadata: Metadata = {
  metadataBase: new URL('https://yakkshit.com'),
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
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppNav />
          <main className="min-h-[calc(100vh-5rem)] pt-2 pb-8">{children}</main>
          <Toaster />
          <CookieBanner />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}