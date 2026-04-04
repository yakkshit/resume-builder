'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import { isLocalStorageAvailable } from '@/lib/safe-local-storage'

/**
 * next-themes mostly tolerates blocked storage, but some embedded / sandboxed
 * documents break storage entirely; force a stable theme so the tree still renders.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [storageBroken, setStorageBroken] = React.useState(false)

  React.useEffect(() => {
    setStorageBroken(!isLocalStorageAvailable())
  }, [])

  if (storageBroken) {
    return (
      <NextThemesProvider
        {...props}
        forcedTheme="light"
        enableSystem={false}
        defaultTheme="light"
      >
        {children}
      </NextThemesProvider>
    )
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}