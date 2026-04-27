/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        // matches any custom domain you point at R2
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    // keep better-sqlite3 as a native CJS module — don't bundle it
    config.externals = [...(config.externals || []), { 'better-sqlite3': 'commonjs better-sqlite3' }]
    return config
  },
}

module.exports = nextConfig
