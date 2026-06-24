"""
scrapers/magazineluiza.py — Scraper da Magazine Luiza
Usa a API de busca da Magalu
"""

from .base import BaseScraper

BUSCAS = [
    ("geladeira",              "eletrodomesticos"),
    ("lavadora de roupas",     "eletrodomesticos"),
    ("ar condicionado",        "eletrodomesticos"),
    ("micro-ondas",            "eletrodomesticos"),
    ("aspirador de po",        "eletrodomesticos"),
    ("smart tv 4k",            "eletronicos"),
    ("smartphone",             "eletronicos"),
    ("notebook",               "eletronicos"),
]

MIN_DESCONTO = 15
SEARCH_API = "https://www.magazineluiza.com.br/busca/{q}/?page=1"


class MagazineLuizaScraper(BaseScraper):
    nome = "MagazineLuiza"
    loja = "Magazine Luiza"

    def raspar(self) -> list:
        promos = []
        for termo, categoria in BUSCAS:
            items = self._buscar(termo, categoria)
            promos.extend(items)
        return promos

    def _buscar(self, termo: str, categoria: str) -> list:
        """Raspa resultados de busca da Magalu."""
        from bs4 import BeautifulSoup
        from .base import limpar_preco

        url = f"https://www.magazineluiza.com.br/busca/{termo.replace(' ', '%20')}/"
        resp = self.get(url)
        if not resp:
            return []

        soup = BeautifulSoup(resp.text, "lxml")
        promos = []

        # Magalu usa data attributes nos cards de produto
        for card in soup.select("[data-testid='product-card'], [class*='productCard']")[:15]:
            titulo_el = card.select_one("[class*='title'], [class*='product-title'], h2, h3")
            if not titulo_el:
                # Tenta atributo data-description
                titulo = card.get("data-description", "")
            else:
                titulo = titulo_el.get_text(strip=True)

            if not titulo or len(titulo) < 5:
                continue

            link = card.select_one("a[href]")
            if not link:
                continue
            href = link.get("href", "")
            url_prod = href if href.startswith("http") else f"https://www.magazineluiza.com.br{href}"

            # Preços
            preco_atual_el = card.select_one("[class*='priceContainer'] [class*='price']:last-child, [data-testid='price-value']")
            preco_orig_el  = card.select_one("[class*='originalPrice'], [class*='price-from'], del")

            preco_atual    = limpar_preco(preco_atual_el.get_text() if preco_atual_el else "")
            preco_original = limpar_preco(preco_orig_el.get_text() if preco_orig_el else "")

            if not preco_atual or preco_atual <= 0:
                # Tenta data-price
                preco_atual = limpar_preco(card.get("data-price", ""))

            if not preco_atual:
                continue

            if not preco_original or preco_original <= preco_atual:
                preco_original = preco_atual * 1.3

            desconto = round((1 - preco_atual / preco_original) * 100)
            if desconto < MIN_DESCONTO:
                continue

            p = self.montar_promo(
                titulo=titulo,
                preco_atual=preco_atual,
                preco_original=preco_original,
                desconto_pct=desconto,
                url=url_prod,
                categoria=categoria,
            )
            promos.append(p)

        return promos
