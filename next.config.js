/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  output: 'standalone',
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  eslint: {
    // 🎯 ESLint警告をエラーではなく警告として扱う
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  // 🔧 TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
