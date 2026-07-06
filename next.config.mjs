import { createRequire } from "node:module"
import path from "node:path"
const require = createRequire(import.meta.url)

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@browsermt/bergamot-translator", "franc-min", "trigram-utils"],
  // Do NOT set `allowedDevOrigins` unless you list every dev hostname you use.
  // When set, Next switches from "warn" to **block** for unknown origins and breaks /_next/* loads.
  // For tunnel hosts, either omit this key (warn-only) or add e.g. '*.trycloudflare.com' patterns.
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/',
        permanent: true,
      },
    ]
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
    'pdf-parse',
    'pdfjs-dist',
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
    if (!isServer) {
      config.experiments = {
        ...(config.experiments || {}),
        asyncWebAssembly: true,
      }
    }
    // Production only: Force single React instance for @react-pdf (fixes Minified React #31 on Vercel).
    // Alias to package DIRECTORIES so react/jsx-dev-runtime etc. still resolve. Skip in dev to avoid resolution issues.
    if (isServer && process.env.NODE_ENV === "production") {
      const reactDir = path.dirname(require.resolve("react/package.json"))
      const reactDomDir = path.dirname(require.resolve("react-dom/package.json"))
      config.resolve.alias["react"] = reactDir
      config.resolve.alias["react-dom"] = reactDomDir
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