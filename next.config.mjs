import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
      },
    ],
  },
  // Externalize @react-pdf packages so they share node_modules React (fixes Minified React #31 in production).
  serverExternalPackages: [
    '@react-pdf/renderer',
    '@react-pdf/primitives',
    '@react-pdf/layout',
    '@react-pdf/pdfkit',
    'yoga-layout',
    'pdfkit',
  ],
  experimental: {
    // Disabled - can trigger "Cannot read properties of undefined (reading 'length')" in webpack
    // webpackBuildWorker: true,
    // parallelServerBuildTraces: true,
    // parallelServerCompiles: true,
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false
    // Force single React instance for @react-pdf/renderer (fixes Minified React error #31 in production)
    if (isServer) {
      // Use `$` to avoid breaking subpath imports like `react/jsx-dev-runtime`
      config.resolve.alias["react$"] = require.resolve("react")
      config.resolve.alias["react-dom$"] = require.resolve("react-dom")
    }
    return config
  },
}

mergeConfig(nextConfig, userConfig)

// Ensure problematic experimental flags stay disabled (avoids "Cannot read properties of undefined (reading 'length')")
nextConfig.experimental = {
  ...nextConfig.experimental,
  webpackBuildWorker: false,
  parallelServerBuildTraces: false,
  parallelServerCompiles: false,
}

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig