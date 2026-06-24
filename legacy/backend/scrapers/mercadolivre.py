"""
scrapers/mercadolivre.py — Scraper do Mercado Livre
Usa a API pública de busca do ML (não requer autenticação)
"""

import re
from bs4 import BeautifulSoup
from .base import BaseScraper, limpar_preco, gerar_id

BUSCAS = [
    ("notebook",          "eletronicos"),
    ("smartphone samsung","eletronicos"),
    ("ssd nvme",          "hardware"),
    ("placa de video rtx","hardware"),
    ("geladeira",         "eletrodomesticos"),
    ("ar condicionado",   "eletrodomesticos"),
    ("lavadora de roupas","eletrodomesticos"),
    ("furadeira",         "ferramentas"),
    ("parafusadeira",     "ferramentas"),
    ("kit revisao carro", "automotivo"),
    ("aspirador de po",   "casa"),
    ("cafeteira",         "casa"),
]

MIN_DESCONTO = 20  # % mínimo para incluir


class MercadoLivreScraper(BaseScraper):
    nome     = "MercadoLivre"
    loja     = "Mercado Livre"
    BASE_URL = "https://api.mercadolibre.com/sites/MLB/search"
    SITE_URL = "https://www.mercadolivre.com.br"

    def raspar(self) -> list:
        promos = []
        for termo, categoria in BUSCAS:
            items = self._buscar(termo, categoria)
            promos.extend(items)
        return promos

    def _buscar(self, termo: str, categoria: str) -> list:
        """Usa API pública do ML para buscar produtos em promoção."""
        params = {
            "q": termo,
            "sort": "price_asc",
            "limit": 20,
            "condition": "new",
        }
        resp = self.get(self.BASE_URL, params=params)
        if not resp:
            return []

        try:
            data = resp.json()
        except Exception:
            return []

        promos = []
        for item in data.get("results", []):
            preco_atual    = float(item.get("price", 0))
            preco_original = float(item.get("original_price") or 0)

            # Só considera com desconto real
            if preco_original <= 0 or preco_original <= preco_atual:
                continue

            desconto = round((1 - preco_atual / preco_original) * 100)
            if desconto < MIN_DESCONTO:
                continue

            titulo = item.get("title", "")
            url    = item.get("permalink", "")
            if not url or not titulo:
                continue

            p = self.montar_promo(
                titulo=titulo,
                preco_atual=preco_atual,
                preco_original=preco_original,
                desconto_pct=desconto,
                url=url,
                categoria=categoria,
            )
            promos.append(p)

        return promos
