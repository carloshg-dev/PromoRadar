import { publicCacheFetch, type PublicCacheContext } from "./src/infrastructure/cloudflare/public-response-cache";
// @ts-ignore Artefatos gerados por Next/OpenNext antes do empacotamento Wrangler.
import generated from "./.open-next/worker.js";
// @ts-ignore BUILD_ID usa a regra Text do Wrangler, sem leitura de disco no Worker.
import nextBuildId from "./.next/BUILD_ID";

if (typeof nextBuildId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(nextBuildId.trim())) throw new Error("invalid_public_cache_build_id");
const build = nextBuildId.trim();

export default {
  async fetch(request: Request, env: Record<string, unknown>, context: PublicCacheContext): Promise<Response> {
    if (new URL(request.url).pathname.replace(/\/$/, "") === "/_next/image") {
      return new Response(null, { status: 404, headers: { "cache-control": "public, max-age=3600", "x-promodetec-build": build } });
    }
    // Permite comparar o mesmo build sem cache e desativá-lo em contingência.
    if (env.PROMODETEC_PUBLIC_CACHE_DISABLED === "1") return generated.fetch(request, env, context);
    const cache = await caches.open("promodetec-public-responses").catch(() => null);
    if (!cache) return generated.fetch(request, env, context);
    return publicCacheFetch(request, build, cache, context, input => generated.fetch(input, env, context));
  },
};
// @ts-ignore Mantém os exports gerados sem criar novos bindings.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
