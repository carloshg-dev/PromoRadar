"""
scrapers/pichau.py — Scraper da Pichau
Raspa a página de ofertas da Pichau via HTML
"""

from bs4 import BeautifulSoup
from .base import BaseScraper, limpar_preco, gerar_id

PAGINAS = [
    ("https://www.pichau.com.br/hardware/ssd-e-armazenamento", "hardware"),
    ("https://www.pichau.com.br/hardware/placas-de-video",      "hardware"),
    ("https://www.pichau.com.br/hardware/processadores",        "hardware"),
    ("https://www.pichau.com.br/computadores/notebooks",        "eletronicos"),
]

MIN_DESCONTO = 15


class PichauScraper(BaseScraper):
    nome = "Pichau"
    loja = "Pichau"

    def raspar(self) -> list:
        promos = []
        for url_cat, categoria in PAGINAS:
            items = self._raspar_pagina(url_cat, categoria)
            promos.extend(items)
        return promos

    def _raspar_pagina(self, url: str, categoria: str) -> list:
        resp = self.get(url)
        if not resp:
            return []

        soup = BeautifulSoup(resp.text, "lxml")
        promos = []

        # Pichau usa cards de produto com estrutura padrão
        cards = soup.select("div[class*='MuiCard'], div[class*='product-card'], article[class*='product']")

        for card in cards[:20]:
            titulo_el = card.select_one("h2, h3, [class*='name'], [class*='title']")
            if not titulo_el:
                continue
            titulo = titulo_el.get_text(strip=True)

            link_el = card.select_one("a[href]")
            if not link_el:
                continue
            href = link_el.get("href", "")
            url_prod = href if href.startswith("http") else f"https://www.pichau.com.br{href}"

            # Preços
            preco_els = card.select("[class*='price'], [class*='Price'], span[class*='valor']")
            precos = []
            for el in preco_els:
                v = limpar_preco(el.get_text(strip=True))
                if v and v > 10:
                    precos.append(v)

            if len(precos) < 1:
                continue

            preco_atual    = min(precos)
            preco_original = max(precos) if len(precos) > 1 else preco_atual * 1.2

            desconto = round((1 - preco_atual / preco_original) * 100) if preco_original > preco_atual else 0
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
