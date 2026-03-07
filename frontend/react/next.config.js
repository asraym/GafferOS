/** @type {import('next').NextConfig} */
const nextConfig = {
  // API calls go to FastAPI on port 8000
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ]
  },
}

module.exports = nextConfig