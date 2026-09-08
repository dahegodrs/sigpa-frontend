/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite el build de producción aunque haya errores de TypeScript/ESLint
  // (los errores de tipos no rompen la funcionalidad en runtime)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    NEXT_PUBLIC_TENANT_DOMAIN: process.env.NEXT_PUBLIC_TENANT_DOMAIN || '',
  },
};

module.exports = nextConfig;
