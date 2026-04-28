/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  assetPrefix: '/global-clinical-trials-insight-and-commentary-platform-overview/',
  basePath: '/global-clinical-trials-insight-and-commentary-platform-overview',
}

module.exports = nextConfig
