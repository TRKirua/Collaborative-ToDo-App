/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Force dynamic rendering for all pages
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Disable static optimization
  output: "standalone",
}

module.exports = nextConfig
