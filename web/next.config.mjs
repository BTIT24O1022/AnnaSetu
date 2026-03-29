/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://annasetu-47ci.onrender.com/api/:path*',
      },
    ]
  },
}

export default nextConfig
