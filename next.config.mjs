/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  eslint: { ignoreDuringBuilds: true },
  // Playwright é usado só pela coleta via browser (local/runner), por import
  // dinâmico. Mantém-no fora do bundle das funções serverless.
  experimental: {
    serverComponentsExternalPackages: ["playwright", "playwright-core"]
  }
};
export default nextConfig;
