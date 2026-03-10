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
  // Keep @react-pdf/renderer bundled so in-process fallback shares React (production).
  serverExternalPackages: [
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
  webpack: (config) => {
    config.resolve.alias.canvas = false
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