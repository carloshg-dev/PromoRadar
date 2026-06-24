/** 2ª tentativa: cabeçalhos completos de navegador para Pichau e Terabyte. */
const HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
};
const alvos = [
  "https://www.terabyteshop.com.br/hardware/placas-de-video",
  "https://www.pichau.com.br/hardware/placas-de-video",
];
(async () => {
  for (const url of alvos) {
    try {
      const r = await fetch(url, { headers: HEADERS });
      const t = await r.text();
      const temPreco = /R\$\s?\d/.test(t);
      console.log(`\n==== ${url}\nstatus ${r.status} | tamanho ${t.length} | tem preço no HTML? ${temPreco}`);
      const i = t.indexOf("R$");
      if (i > 0) console.log("trecho:", t.slice(i - 120, i + 40).replace(/\s+/g, " "));
    } catch (e) { console.log(url, "ERRO", (e as Error).message); }
  }
})();
