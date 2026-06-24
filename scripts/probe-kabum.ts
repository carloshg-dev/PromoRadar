/** Lista menu + título + desconto de vários produtos da Kabum (compacto). */
const url = "https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products?page_number=1&page_size=25&sort=-discount";

fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } })
  .then((r) => r.json())
  .then((j: any) => {
    const arr = j.data ?? [];
    for (const it of arr) {
      const a = it.attributes ?? {};
      console.log(`[${a.discount_percentage ?? 0}%] ${a.menu}  ::  ${String(a.title).slice(0, 40)}`);
    }
  })
  .catch((e) => console.error("ERRO:", e.message));
