/** Descobre como a TerabyteShop serve dados. */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";
const url = "https://www.terabyteshop.com.br/hardware/placas-de-video";
fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } })
  .then(async (r) => {
    const t = await r.text();
    console.log("status", r.status, "| tamanho", t.length);
    const temProduto = /class="[^"]*product[^"]*"/i.test(t);
    const temPreco = /R\$\s?\d/.test(t);
    console.log("tem cards de produto no HTML?", temProduto, "| tem preço no HTML?", temPreco);
    // mostra um trecho onde aparece "R$"
    const i = t.indexOf("R$");
    if (i > 0) console.log("trecho perto de preço:", t.slice(i - 150, i + 60).replace(/\s+/g, " "));
  })
  .catch((e) => console.log("ERRO", e.message));
