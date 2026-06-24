"""
scrapers/base.py — Classe base para todos os scrapers
"""

import hashlib
import re
import time
import random
import httpx
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
from rich.console import Console

console = Console()

HEADERS_BASE = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

EMOJIS_CATEGORIA = {
    "eletronicos":      "💻",
    "hardware":         "🖥️",
    "eletrodomesticos": "🏠",
    "automotivo":       "🚗",
    "ferramentas":      "🔧",
    "casa":             "🛋️",
}


def gerar_id(url: str) -> str:
    """Gera ID único baseado na URL do produto."""
    return hashlib.md5(url.encode()).hexdigest()[:16]


def limpar_preco(texto: str) -> Optional[float]:
    """Converte string de preço em float."""
    if not texto:
        return None
    texto = re.sub(r"[^\d,.]", "", str(texto))
    texto = texto.replace(".", "").replace(",", ".")
    try:
        return float(texto)
    except (ValueError, TypeError):
        return None


def calcular_desconto(preco_atual: float, preco_original: float) -> int:
    if not preco_original or preco_original <= preco_atual:
        return 0
    return round((1 - preco_atual / preco_original) * 100)


def delay_aleatorio(min_s=1.5, max_s=4.0):
    """Delay aleatório para não sobrecarregar os servidores."""
    time.sleep(random.uniform(min_s, max_s))


class BaseScraper(ABC):
    nome = "Base"
    loja = "Desconhecida"
    categoria = "eletronicos"

    def __init__(self):
        self.client = httpx.Client(
            headers={**HEADERS_BASE, "User-Agent": random.choice(USER_AGENTS)},
            timeout=30,
            follow_redirects=True,
        )
        self.resultados = []

    def get(self, url: str, params=None) -> Optional[httpx.Response]:
        try:
            delay_aleatorio(1.0, 3.0)
            resp = self.client.get(url, params=params)
            resp.raise_for_status()
            return resp
        except httpx.HTTPStatusError as e:
            console.print(f"[red][{self.nome}] HTTP {e.response.status_code}: {url}[/red]")
            return None
        except Exception as e:
            console.print(f"[red][{self.nome}] Erro request: {e}[/red]")
            return None

    def montar_promo(self, **kwargs) -> dict:
        url = kwargs.get("url", "")
        preco_atual = kwargs.get("preco_atual", 0)
        preco_original = kwargs.get("preco_original", preco_atual)
        desconto = kwargs.get("desconto_pct") or calcular_desconto(preco_atual, preco_original)
        categoria = kwargs.get("categoria", self.categoria)
        return {
            "id":             gerar_id(url),
            "titulo":         kwargs.get("titulo", "")[:500],
            "loja":           kwargs.get("loja", self.loja),
            "categoria":      categoria,
            "preco_atual":    round(preco_atual, 2),
            "preco_original": round(preco_original, 2),
            "desconto_pct":   desconto,
            "url":            url,
            "emoji":          EMOJIS_CATEGORIA.get(categoria, "🛒"),
            "cupom":          kwargs.get("cupom"),
            "fonte":          self.nome,
            "verificado_em":  datetime.now().isoformat(),
        }

    @abstractmethod
    def raspar(self) -> list:
        """Implementado por cada scraper. Retorna lista de promos."""
        pass

    def executar(self) -> list:
        console.print(f"[cyan][{self.nome}] Iniciando scraping...[/cyan]")
        try:
            self.resultados = self.raspar()
            # Filtrar inválidos
            validos = [
                p for p in self.resultados
                if p.get("preco_atual", 0) > 0
                and p.get("preco_original", 0) >= p.get("preco_atual", 0)
                and p.get("desconto_pct", 0) >= 10
                and p.get("url", "").startswith("http")
                and len(p.get("titulo", "")) > 5
            ]
            console.print(f"[green][{self.nome}] {len(validos)} promoções válidas encontradas[/green]")
            return validos
        except Exception as e:
            console.print(f"[red][{self.nome}] Erro fatal: {e}[/red]")
            return []
        finally:
            self.client.close()
