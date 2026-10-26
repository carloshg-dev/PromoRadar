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
  // Playwright é usado só pela coleta Node (local/runner). No build Cloudflare,
  // o loader inteiro é substituído antes de o OpenNext percorrer o bundle.
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
  webpack(config, { isServer, webpack }) {
    if (isServer && cloudflareBuild) {
      const playwrightDisabled = path.join(
        rootDir,
        "src/infrastructure/scraping/core/playwright-disabled.ts",
      );
      const collectionDisabled = path.join(
        rootDir,
        "src/services/collection-disabled.ts",
      );
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /playwright-loader$/,
          playwrightDisabled,
        ),
        new webpack.NormalModuleReplacementPlugin(
          /collection-runtime$/,
          collectionDisabled,
        ),
      );
    }
    return config;
  }
};
export default nextConfig;
