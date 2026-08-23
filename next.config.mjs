import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const cloudflareBuild = process.env.OPENNEXT_CLOUDFLARE === "1";

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
    serverComponentsExternalPackages: cloudflareBuild ? [] : ["playwright", "playwright-core"],
    ...(cloudflareBuild
      ? {
          outputFileTracingExcludes: {
            "*": ["./node_modules/playwright/**", "./node_modules/playwright-core/**"],
          },
        }
      : {}),
  },
  webpack(config, { isServer }) {
    if (isServer && cloudflareBuild) {
      const disabled = path.join(
        rootDir,
        "src/infrastructure/scraping/core/playwright-disabled.ts",
      );
      config.resolve.alias = {
        ...config.resolve.alias,
        "playwright$": disabled,
        "playwright-core$": disabled,
      };
    }
    return config;
  }
};
export default nextConfig;
