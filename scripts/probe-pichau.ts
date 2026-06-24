/** Descobre como a Pichau serve dados. Testa endpoints prováveis. */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";
const tries = [
  "https://www.pichau.com.br/api/pichau/products?categories=placa-de-video&limit=3",
  "https://www.pichau.com.br/hardware/placas-de-video",
];
(async () => {
  for (const url of tries) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "*/*" } });
      const ct = r.headers.get("content-type") || "";
      const t = await r.text();
      console.log("\n====", url);
      console.log("status", r.status, "| tipo", ct, "| tamanho", t.length);
      const m = t.match(/__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (m) console.log("TEM __NEXT_DATA__ (Next.js) — tamanho:", m[1]!.length);
      const apollo = t.includes("__APOLLO_STATE__") || t.includes("apollographql");
      if (apollo) console.log("Indício de GraphQL/Apollo");
      console.log("trecho:", t.slice(0, 200).replace(/\s+/g, " "));
    } catch (e) { console.log(url, "ERRO", (e as Error).message); }
  }
})();
