
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'https://itshlp.onrender.com'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
