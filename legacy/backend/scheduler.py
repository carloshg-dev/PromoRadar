"""
scheduler.py — Agendador principal do PromoRadar
Executa os scrapers automaticamente em intervalos configuráveis
"""

import sys
import os
import time
import schedule
import threading
from datetime import datetime
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.layout import Layout

sys.path.insert(0, os.path.dirname(__file__))

from database.db import (
    init_db, salvar_promo, finalizar_promo,
    get_promos, get_stats, limpar_finalizadas_antigas,
    registrar_log
)
from scrapers.mercadolivre import MercadoLivreScraper
from scrapers.kabum        import KabumScraper
from scrapers.pichau       import PichauScraper
from scrapers.leroymerlin  import LeroyMerlinScraper
from scrapers.magazineluiza import MagazineLuizaScraper

console = Console()

SCRAPERS = [
    MercadoLivreScraper,
    KabumScraper,
    PichauScraper,
    LeroyMerlinScraper,
    MagazineLuizaScraper,
]

# Configurações de intervalo (em minutos)
INTERVALO_SCRAPING  = 15   # roda scrapers a cada 15 min
INTERVALO_LIMPEZA   = 60   # limpa antigas a cada 1h
INTERVALO_STATUS    = 5    # exibe status a cada 5 min

_lock = threading.Lock()
_stats = {"rodadas": 0, "total_salvas": 0, "ultima_rodada": None, "erros": 0}


def rodar_todos_scrapers():
    """Executa todos os scrapers e salva no banco."""
    global _stats
    with _lock:
        agora = datetime.now().strftime("%H:%M:%S")
        console.rule(f"[cyan]🔍 Iniciando scraping — {agora}[/cyan]")

        total_novas = 0
        total_erros = 0

        for ScraperClass in SCRAPERS:
            try:
                scraper = ScraperClass()
                promos  = scraper.executar()

                salvas = 0
                for p in promos:
                    if salvar_promo(p):
                        salvas += 1
                total_novas += salvas

                console.print(f"  [green]✓[/green] {ScraperClass.loja}: {salvas} promoções salvas")
                registrar_log("INFO", f"{ScraperClass.loja}: {salvas} promos salvas")

            except Exception as e:
                total_erros += 1
                console.print(f"  [red]✗[/red] {ScraperClass.__name__}: {e}")
                registrar_log("ERRO", f"{ScraperClass.__name__}: {e}")

        _stats["rodadas"]      += 1
        _stats["total_salvas"] += total_novas
        _stats["ultima_rodada"] = datetime.now().isoformat()
        _stats["erros"]        += total_erros

        stats = get_stats()
        console.print(
            Panel(
                f"[green]✅ Scraping concluído[/green]\n"
                f"   Novas/Atualizadas: [bold]{total_novas}[/bold]\n"
                f"   Ativas no banco:   [bold cyan]{stats['ativas']}[/bold cyan]\n"
                f"   Erros:             [bold red]{total_erros}[/bold red]",
                title=f"Rodada #{_stats['rodadas']}",
                border_style="green"
            )
        )


def exibir_status():
    """Exibe tabela de status atual."""
    stats = get_stats()
    promos = get_promos()

    tbl = Table(title="📊 PromoRadar — Status Atual", show_header=True, header_style="bold cyan")
    tbl.add_column("Categoria",  style="dim", width=20)
    tbl.add_column("Ativas",     justify="right")
    tbl.add_column("Lojas",      style="dim")

    cats = stats.get("por_categoria", {})
    lojas = stats.get("por_loja", {})

    for cat, qtd in cats.items():
        promos_cat = [p for p in promos if p["categoria"] == cat]
        lojas_cat  = list({p["loja"] for p in promos_cat})[:3]
        tbl.add_row(cat, str(qtd), ", ".join(lojas_cat))

    console.print(tbl)
    console.print(f"\n[bold]Total ativas:[/bold] {stats['ativas']}  |  "
                  f"[bold]Com cupom:[/bold] {stats['cupons']}  |  "
                  f"[bold]Maior desconto:[/bold] {stats['max_desconto']}%")


def iniciar_api():
    """Inicia o servidor FastAPI em thread separada."""
    import uvicorn
    from api.server import app
    console.print("[cyan]🌐 Iniciando API local em http://localhost:8765[/cyan]")
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="warning")


def main():
    console.print(Panel(
        "[bold cyan]📡 PromoRadar Backend[/bold cyan]\n"
        "Sistema de automação de scraping local\n\n"
        f"Scrapers configurados: [bold]{len(SCRAPERS)}[/bold]\n"
        f"Intervalo de scraping: [bold]{INTERVALO_SCRAPING} minutos[/bold]\n"
        f"API local: [bold]http://localhost:8765[/bold]",
        border_style="cyan"
    ))

    # Inicializa banco de dados
    init_db()

    # Inicia API em thread separada
    api_thread = threading.Thread(target=iniciar_api, daemon=True)
    api_thread.start()
    time.sleep(2)  # aguarda API iniciar

    # Primeira rodada imediata
    console.print("[yellow]▶ Executando primeira rodada de scraping...[/yellow]")
    rodar_todos_scrapers()

    # Agenda tarefas
    schedule.every(INTERVALO_SCRAPING).minutes.do(rodar_todos_scrapers)
    schedule.every(INTERVALO_LIMPEZA).minutes.do(limpar_finalizadas_antigas)
    schedule.every(INTERVALO_STATUS).minutes.do(exibir_status)

    console.print(f"\n[green]✅ Agendador ativo[/green]")
    console.print(f"   Próxima rodada: em {INTERVALO_SCRAPING} minutos")
    console.print(f"   Pressione [bold]Ctrl+C[/bold] para encerrar\n")

    # Loop principal
    try:
        while True:
            schedule.run_pending()
            time.sleep(30)
    except KeyboardInterrupt:
        console.print("\n[yellow]⏹ Encerrando PromoRadar Backend...[/yellow]")


if __name__ == "__main__":
    main()
