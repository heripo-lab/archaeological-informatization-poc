/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // compiler: {
  //   removeConsole: process.env.NODE_ENV === 'production' && {
  //     exclude: ['error'],
  //   },
  // },
};

module.exports = nextConfig;
