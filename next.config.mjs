/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      // Fotos legadas da Kabum vêm em HTTP (images1/images6.kabum.com.br) e o
      // next/image rejeitava, quebrando o render onde caíam (rodízio da home).
      // Seguro: o next/image PROXIA a imagem pelo nosso servidor (sem mixed content).
      { protocol: "http", hostname: "**.kabum.com.br" }
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
