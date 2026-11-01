/** Respostas públicas prontas evitam renderizar o Next a cada visita. */
const TTL_SECONDS = 120;
const PREFIX_BYTES = 64 * 1024;
const MAX_BODY_BYTES = 1024 * 1024;
const ROUTER_HEADERS = ["rsc", "next-router-state-tree", "next-router-prefetch", "next-router-segment-prefetch", "next-url"] as const;
const SAFE_VARY = new Set<string>([...ROUTER_HEADERS, "accept-encoding"]);
const PUBLIC_PATHS = new Set(["/", "/ofertas", "/comparar"]);
const COOKIE_WITHOUT_SERVER_STATE = /^(?:cf_clearance|__cf_bm|_cfuvid|__cflb|_ga(?:_[a-zA-Z0-9]+)?|_gid|_gat(?:_[a-zA-Z0-9]+)?|_clck|_clsk)$/;

export interface PublicCacheContext { waitUntil(task: Promise<unknown>): void }
type OriginHandler = (request: Request) => Promise<Response>;

function eligibleUrl(request: Request): URL | null {
  if (request.method !== "GET" || request.url.length > 2048) return null;
  for (const header of ["authorization", "range", "next-action", "x-prerender-revalidate", "x-nextjs-revalidated-tags", "x-middleware-subrequest"]) {
    if (request.headers.has(header)) return null;
  }
  for (const [name] of request.headers) {
    if (/^x-(?:middleware-|nextjs-|invoke-)|^x-(?:matched-path|forwarded-host)$/.test(name)) return null;
  }
  if (/no-cache|no-store/i.test(request.headers.get("cache-control") ?? "") || request.headers.has("pragma")) return null;
  const cookies = request.headers.get("cookie") ?? "";
  if (cookies.length > 8192 || cookies.split(";").some(cookie => {
    const name = cookie.trim().split("=", 1)[0] ?? "";
    return Boolean(name) && !COOKIE_WITHOUT_SERVER_STATE.test(name);
  })) return null;
  const url = new URL(request.url);
  if (!["https:", "http:"].includes(url.protocol)) return null;
  const category = /^\/categoria\/[a-z0-9-]{1,80}$/.test(url.pathname);
  const product = /^\/produto\/[0-9a-f-]{36}$/i.test(url.pathname);
  if (!PUBLIC_PATHS.has(url.pathname) && !category && !product) return null;
  const allowed = url.pathname === "/ofertas" ? ["categoria", "busca", "loja", "pagina", "ate", "colecao"]
    : category ? ["loja", "pagina", "ate"] : url.pathname === "/comparar" ? ["categoria", "vertical"] : [];
  const seen = new Set<string>();
  for (const [name, value] of url.searchParams) {
    if (seen.has(name) || value.length > 160) return null;
    seen.add(name);
    if (name === "_rsc" && request.headers.get("rsc") === "1") continue;
    if (!allowed.includes(name) && !/^utm_(?:source|medium|campaign|term|content|id)$/.test(name) && !["gclid", "fbclid"].includes(name)) return null;
  }
  // Nonce de transporte, não filtro; a árvore do roteador entra na chave.
  if (request.headers.get("rsc") === "1") url.searchParams.delete("_rsc");
  return url;
}

function responseHeaders(response: Response, state: string, build: string): Headers {
  const headers = new Headers(response.headers);
  headers.set("x-promodetec-cache", state);
  headers.set("x-promodetec-build", build);
  return headers;
}

/** Inspeção de prefixo limitada; o restante segue por stream com backpressure. */
async function readyBody(response: Response): Promise<ReadableStream<Uint8Array> | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  const decoder = new TextDecoder();
  let bytes = 0, prefix = "", ready = false;
  while (bytes < PREFIX_BYTES) {
    const part = await reader.read();
    if (part.done) break;
    const remainingPrefix = PREFIX_BYTES - bytes;
    bytes += part.value.byteLength;
    if (bytes > MAX_BODY_BYTES) break;
    chunks.push(part.value);
    prefix += decoder.decode(part.value.subarray(0, remainingPrefix), { stream: true });
    if (/data-public-cache(?:=|\":)\"unavailable\"/.test(prefix)) break;
    if (/data-public-cache(?:=|\":)\"ready\"/.test(prefix)) { ready = true; break; }
  }
  if (!ready) { void reader.cancel().catch(() => {}); return null; }
  let cursor = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (cursor < chunks.length) { controller.enqueue(chunks[cursor++]!); return; }
      const part = await reader.read();
      if (part.done) { controller.close(); reader.releaseLock(); return; }
      bytes += part.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        controller.error(new Error("public_cache_body_limit"));
        return;
      }
      controller.enqueue(part.value);
    },
    cancel() { return reader.cancel(); },
  });
}

export async function publicCacheFetch(
  request: Request, build: string, cache: Pick<Cache, "match" | "put">,
  context: PublicCacheContext, origin: OriginHandler,
): Promise<Response> {
  const url = eligibleUrl(request);
  if (!url) {
    const response = await origin(request);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders(response, "BYPASS", build) });
  }
  const variant = ROUTER_HEADERS.map(name => request.headers.get(name) ?? "");
  if (variant.some(value => value.length > 8192)) return origin(request);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([url.href, variant])));
  const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
  const key = new Request(`${url.origin}/_promodetec-cache/${encodeURIComponent(build)}/${hash}`);
  try {
    const hit = await cache.match(key);
    if (hit) {
      const headers = responseHeaders(hit, "HIT", build);
      headers.set("cache-control", "private, no-store");
      return new Response(hit.body, { status: hit.status, statusText: hit.statusText, headers });
    }
  } catch { /* Cache indisponível não impede o servidor original. */ }
  const response = await origin(request);
  const type = (response.headers.get("content-type") ?? "").split(";", 1)[0]!.trim().toLowerCase();
  const expectedType = request.headers.get("rsc") === "1" ? "text/x-component" : "text/html";
  const varies = (response.headers.get("vary") ?? "").toLowerCase().split(",").map(value => value.trim()).filter(Boolean);
  const canStore = response.status === 200 && type === expectedType && !response.headers.has("set-cookie")
    && !response.headers.has("location") && !response.headers.has("x-middleware-rewrite") && varies.every(value => SAFE_VARY.has(value));
  if (canStore) {
    const copy = response.clone();
    context.waitUntil((async () => {
      const body = await readyBody(copy);
      if (!body) return;
      const headers = new Headers(copy.headers);
      headers.set("cache-control", `public, max-age=${TTL_SECONDS}`);
      headers.delete("expires");
      headers.delete("content-length");
      await cache.put(key, new Response(body, { headers }));
    })().catch(() => { /* Falha no cache não afeta a resposta do visitante. */ }));
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders(response, canStore ? "MISS" : "BYPASS", build) });
}
