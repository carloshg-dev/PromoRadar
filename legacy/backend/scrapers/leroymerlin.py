"""
scrapers/leroymerlin.py — Scraper da Leroy Merlin
Usa a API de busca pública da Leroy Merlin Brasil
"""

from .base import BaseScraper

BUSCAS = [
    ("furadeira",          "ferramentas"),
    ("parafusadeira",      "ferramentas"),
    ("serra",              "ferramentas"),
    ("kit ferramentas",    "ferramentas"),
    ("chave combinada",    "ferramentas"),
    ("escada",             "ferramentas"),
    ("torneira",           "casa"),
    ("chuveiro",           "casa"),
]

MIN_DESCONTO = 15
API_URL = "https://www.leroymerlin.com.br/api/product/search"


class LeroyMerlinScraper(BaseScraper):
    nome = "LeroyMerlin"
    loja = "Leroy Merlin"

    def raspar(self) -> list:
        promos = []
        for termo, categoria in BUSCAS:
            items = self._buscar(termo, categoria)
            promos.extend(items)
        return promos

    def _buscar(self, termo: str, categoria: str) -> list:
        params = {
            "q":        termo,
            "page":     0,
            "pageSize": 20,
            "sortBy":   "price-asc",
        }
        resp = self.get(API_URL, params=params)
        if not resp:
            return self._buscar_html(termo, categoria)

        try:
            data = resp.json()
        except Exception:
            return self._buscar_html(termo, categoria)

        promos = []
        produtos = data.get("products", data.get("results", []))

        for item in produtos:
            preco_atual    = float(item.get("bestPrice", item.get("price", 0)) or 0)
            preco_original = float(item.get("listPrice", item.get("priceFrom", 0)) or 0)

            if preco_atual <= 0:
                continue
            if preco_original <= preco_atual:
                preco_original = preco_atual * 1.3  # estimativa conservadora

            desconto = round((1 - preco_atual / preco_original) * 100)
            if desconto < MIN_DESCONTO:
                continue

            nome = item.get("name", item.get("productName", ""))
            slug = item.get("linkText", item.get("slug", ""))
            url  = f"https://www.leroymerlin.com.br/{slug}/p" if slug else ""
            if not nome or not url:
                continue

            p = self.montar_promo(
                titulo=nome,
                preco_atual=preco_atual,
                preco_original=preco_original,
                desconto_pct=desconto,
                url=url,
                categoria=categoria,
            )
            promos.append(p)

        return promos

    def _buscar_html(self, termo: str, categoria: str) -> list:
        """Fallback: scraping HTML da busca."""
        from bs4 import BeautifulSoup
        from .base import limpar_preco
        url = f"https://www.leroymerlin.com.br/pesquisa?q={termo.replace(' ', '+')}"
        resp = self.get(url)
        if not resp:
            return []

        soup = BeautifulSoup(resp.text, "lxml")
        promos = []

        for card in soup.select("product-thumbs, div[class*='product']")[:15]:
            titulo_el = card.select_one("[class*='product-title'], h3, h2")
            if not titulo_el:
                continue
            link = card.select_one("a[href]")
            if not link:
                continue

            href = link.get("href", "")
            url_prod = href if href.startswith("http") else f"https://www.leroymerlin.com.br{href}"
            preco_els = card.select("[class*='price']")
            precos = [limpar_preco(e.get_text()) for e in preco_els if limpar_preco(e.get_text())]

            if not precos:
                continue

            preco_atual = min(precos)
            preco_orig  = max(precos) if len(precos) > 1 else preco_atual * 1.25
            desc = round((1 - preco_atual / preco_orig) * 100)
            if desc < MIN_DESCONTO:
                continue

            promos.append(self.montar_promo(
                titulo=titulo_el.get_text(strip=True),
                preco_atual=preco_atual,
                preco_original=preco_orig,
                desconto_pct=desc,
                url=url_prod,
                categoria=categoria,
            ))

        return promos
