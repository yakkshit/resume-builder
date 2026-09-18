import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/resume-coverletter/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'
import { AuthProvider } from '@/lib/auth/auth-provider'

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
  icons: {
    icon: '/icon.svg',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-Powered Resume Generator',
    description: 'Create, customize, and optimize your resume with AI assistance',
    images: ['./logo.png'],
  },
}

import { isClerkConfigured, getClerkPublishableKey } from '@/lib/auth/clerk-config'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const configured = isClerkConfigured();

  const htmlContent = (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {/* <AppNav /> */}
            <main className="h-full w-full overflow-hidden">{children}</main>
            <Toaster />
            {/* <CookieBanner /> */}
            {process.env.NODE_ENV === 'production' ? <Analytics /> : null}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );

  if (configured) {
    return (
      <ClerkProvider>
        {htmlContent}
      </ClerkProvider>
    );
  }

  return htmlContent;
}