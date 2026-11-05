import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/resume-coverletter/theme-provider'
import { AuthProvider } from '@/lib/auth/auth-provider'
import { CookieBanner } from '@/components/cookie-banner'
import { AuthGuard } from '@/components/auth/auth-guard'
import { StructuredData } from '@/components/seo/structured-data'

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://resume.cedzlabs.com'),
  title: {
    default: 'CareerAgent | Autonomous Career OS & AI Resume Builder',
    template: '%s | CareerAgent',
  },
  description:
    'Autonomous Career OS that tailors your resume to beat ATS parsers, prepares you for tech interviews, and connects external AI agents via personal MCP Server.',
  keywords: [
    'career agent',
    'ai resume builder',
    'ats resume checker',
    'mcp server',
    'model context protocol',
    'latex resume',
    'tech interview prep',
    'rag career vault',
    'career os',
    'cedzlabs',
    'vector pdf resume',
    'dynamic mcp',
  ],
  authors: [
    { name: 'Venkata Sai Yakkshit Reddy Asodi', url: 'https://resume.cedzlabs.com' },
    { name: 'CedzLabs', url: 'https://cedzlabs.com' },
  ],
  creator: 'Venkata Sai Yakkshit Reddy Asodi',
  publisher: 'CedzLabs',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://resume.cedzlabs.com',
  },
  openGraph: {
    title: 'CareerAgent | Autonomous Career OS & AI Resume Builder',
    description:
      'Tailor ATS-compliant resumes, prepare with AI mock interviews, and connect to Claude or Cursor with your dedicated MCP server.',
    url: 'https://resume.cedzlabs.com',
    siteName: 'CareerAgent',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CareerAgent - Autonomous Career OS & AI Resume Builder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareerAgent | Autonomous Career OS & AI Resume Builder',
    description:
      'Autonomous Career OS with ATS resume builder, mock interviews, and personal MCP server.',
    images: ['/og-image.png'],
    creator: '@cedzlabs',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body suppressHydrationWarning className="bg-black text-foreground antialiased selection:bg-white/20 selection:text-white">
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <AuthGuard>
              <main className="min-h-screen w-full">{children}</main>
            </AuthGuard>
            <Toaster />
            <CookieBanner />
            {process.env.NODE_ENV === 'production' ? <Analytics /> : null}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
