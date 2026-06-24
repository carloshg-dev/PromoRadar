"""
scrapers/kabum.py — Scraper da Kabum
Usa a API REST pública da Kabum
"""

from .base import BaseScraper

CATEGORIAS_KABUM = [
    # (endpoint da API kabum, categoria PromoRadar)
    ("hardware/memorias-ram",          "hardware"),
    ("hardware/ssd-2-5",               "hardware"),
    ("hardware/ssd-m-2",               "hardware"),
    ("hardware/placa-de-video",        "hardware"),
    ("hardware/processadores",         "hardware"),
    ("computadores/notebooks",         "eletronicos"),
    ("computadores/monitores",         "eletronicos"),
    ("perifericos/teclados-mecanicos", "hardware"),
    ("perifericos/mouses",             "hardware"),
    ("smartphones",                    "eletronicos"),
]

BASE_API = "https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products"
BASE_URL = "https://www.kabum.com.br"
MIN_DESCONTO = 15


class KabumScraper(BaseScraper):
    nome = "Kabum"
    loja = "Kabum"

    def raspar(self) -> list:
        promos = []
        for cat_path, categoria in CATEGORIAS_KABUM:
            items = self._buscar_categoria(cat_path, categoria)
            promos.extend(items)
        return promos

    def _buscar_categoria(self, cat_path: str, categoria: str) -> list:
        """Busca produtos em oferta da Kabum via API pública."""
        url = f"{BASE_API}/{cat_path}"
        params = {
            "page_number": 1,
            "page_size": 20,
            "sort": "discount",
            "include": "dsc",
        }
        resp = self.get(url, params=params)
        if not resp:
            return []

        try:
            data = resp.json()
        except Exception:
            return []

        promos = []
        for item in data.get("data", []):
            preco_atual    = float(item.get("vlr_oferta") or item.get("vlr_normal") or 0)
            preco_original = float(item.get("vlr_normal") or 0)

            if preco_atual <= 0 or preco_original <= preco_atual:
                continue

            desconto = round((1 - preco_atual / preco_original) * 100)
            if desconto < MIN_DESCONTO:
                continue

            slug    = item.get("des_url_oferta", "")
            produto_id = item.get("cod_produto", "")
            url_prod = f"{BASE_URL}/produto/{produto_id}/{slug}" if slug else f"{BASE_URL}/produto/{produto_id}"

            titulo = item.get("des_produto", "")
            if not titulo or not produto_id:
                continue

            p = self.montar_promo(
                titulo=titulo,
                preco_atual=preco_atual,
                preco_original=preco_original,
                desconto_pct=desconto,
                url=url_prod,
                categoria=categoria,
                cupom=item.get("cupom"),
            )
            promos.append(p)

        return promos
