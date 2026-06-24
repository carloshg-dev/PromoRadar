"""
database/db.py — Gerenciador do banco de dados SQLite
PromoRadar Backend
"""

import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "database" / "promoradar.db"
DB_PATH.parent.mkdir(exist_ok=True)


def get_conn():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Cria as tabelas se não existirem."""
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS promos (
            id          TEXT PRIMARY KEY,
            titulo      TEXT NOT NULL,
            loja        TEXT NOT NULL,
            categoria   TEXT NOT NULL,
            preco_atual REAL NOT NULL,
            preco_original REAL NOT NULL,
            desconto_pct INTEGER NOT NULL,
            url         TEXT NOT NULL,
            emoji       TEXT DEFAULT '🛒',
            cupom       TEXT,
            em_estoque  INTEGER DEFAULT 1,
            ativa       INTEGER DEFAULT 1,
            views       INTEGER DEFAULT 0,
            fonte       TEXT,
            criado_em   TEXT NOT NULL,
            verificado_em TEXT NOT NULL,
            expira_em   TEXT
        );

        CREATE TABLE IF NOT EXISTS finalizadas (
            id          TEXT PRIMARY KEY,
            titulo      TEXT NOT NULL,
            loja        TEXT NOT NULL,
            categoria   TEXT NOT NULL,
            preco_atual REAL NOT NULL,
            preco_original REAL NOT NULL,
            desconto_pct INTEGER NOT NULL,
            url         TEXT NOT NULL,
            emoji       TEXT DEFAULT '🛒',
            motivo_fim  TEXT,
            finalizado_em TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo        TEXT NOT NULL,
            mensagem    TEXT NOT NULL,
            criado_em   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS config (
            chave       TEXT PRIMARY KEY,
            valor       TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_promos_categoria ON promos(categoria);
        CREATE INDEX IF NOT EXISTS idx_promos_ativa ON promos(ativa);
        CREATE INDEX IF NOT EXISTS idx_promos_loja ON promos(loja);
    """)
    conn.commit()
    conn.close()
    print(f"[DB] Banco iniciado em: {DB_PATH}")


def salvar_promo(p: dict) -> bool:
    """Insere ou atualiza uma promoção."""
    conn = get_conn()
    try:
        agora = datetime.now().isoformat()
        conn.execute("""
            INSERT INTO promos
                (id, titulo, loja, categoria, preco_atual, preco_original,
                 desconto_pct, url, emoji, cupom, em_estoque, ativa,
                 fonte, criado_em, verificado_em, expira_em)
            VALUES
                (:id, :titulo, :loja, :categoria, :preco_atual, :preco_original,
                 :desconto_pct, :url, :emoji, :cupom, 1, 1,
                 :fonte, :criado_em, :verificado_em, :expira_em)
            ON CONFLICT(id) DO UPDATE SET
                preco_atual    = excluded.preco_atual,
                preco_original = excluded.preco_original,
                desconto_pct   = excluded.desconto_pct,
                em_estoque     = 1,
                ativa          = 1,
                verificado_em  = excluded.verificado_em,
                cupom          = excluded.cupom
        """, {
            "id":            p.get("id"),
            "titulo":        p.get("titulo", "")[:500],
            "loja":          p.get("loja", ""),
            "categoria":     p.get("categoria", "eletronicos"),
            "preco_atual":   float(p.get("preco_atual", 0)),
            "preco_original":float(p.get("preco_original", 0)),
            "desconto_pct":  int(p.get("desconto_pct", 0)),
            "url":           p.get("url", ""),
            "emoji":         p.get("emoji", "🛒"),
            "cupom":         p.get("cupom"),
            "fonte":         p.get("fonte", "scraper"),
            "criado_em":     agora,
            "verificado_em": agora,
            "expira_em":     p.get("expira_em"),
        })
        conn.commit()
        return True
    except Exception as e:
        print(f"[DB] Erro ao salvar promo: {e}")
        return False
    finally:
        conn.close()


def finalizar_promo(promo_id: str, motivo: str = "expirada"):
    """Move promo para finalizadas e remove das ativas."""
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM promos WHERE id=?", (promo_id,)).fetchone()
        if row:
            conn.execute("""
                INSERT OR REPLACE INTO finalizadas
                    (id, titulo, loja, categoria, preco_atual, preco_original,
                     desconto_pct, url, emoji, motivo_fim, finalizado_em)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """, (
                row["id"], row["titulo"], row["loja"], row["categoria"],
                row["preco_atual"], row["preco_original"], row["desconto_pct"],
                row["url"], row["emoji"], motivo, datetime.now().isoformat()
            ))
            conn.execute("DELETE FROM promos WHERE id=?", (promo_id,))
            conn.commit()
    finally:
        conn.close()


def limpar_finalizadas_antigas():
    """Remove finalizadas com mais de 48h."""
    limite = (datetime.now() - timedelta(hours=48)).isoformat()
    conn = get_conn()
    removed = conn.execute(
        "DELETE FROM finalizadas WHERE finalizado_em < ?", (limite,)
    ).rowcount
    conn.commit()
    conn.close()
    if removed:
        print(f"[DB] {removed} promoção(ões) finalizadas removidas (>48h)")


def get_promos(categoria: str = None, loja: str = None,
               min_desc: int = 0, max_preco: float = None,
               busca: str = None) -> list:
    """Retorna promoções ativas com filtros opcionais."""
    conn = get_conn()
    sql = "SELECT * FROM promos WHERE ativa=1 AND em_estoque=1"
    params = []
    if categoria and categoria != "all":
        sql += " AND categoria=?"
        params.append(categoria)
    if loja:
        sql += " AND loja=?"
        params.append(loja)
    if min_desc > 0:
        sql += " AND desconto_pct>=?"
        params.append(min_desc)
    if max_preco:
        sql += " AND preco_atual<=?"
        params.append(max_preco)
    if busca:
        sql += " AND (titulo LIKE ? OR loja LIKE ?)"
        params.extend([f"%{busca}%", f"%{busca}%"])
    sql += " ORDER BY desconto_pct DESC, verificado_em DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_finalizadas() -> list:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM finalizadas ORDER BY finalizado_em DESC LIMIT 50"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_stats() -> dict:
    conn = get_conn()
    ativas    = conn.execute("SELECT COUNT(*) FROM promos WHERE ativa=1").fetchone()[0]
    cupons    = conn.execute("SELECT COUNT(*) FROM promos WHERE ativa=1 AND cupom IS NOT NULL").fetchone()[0]
    max_desc  = conn.execute("SELECT MAX(desconto_pct) FROM promos WHERE ativa=1").fetchone()[0] or 0
    finalizadas = conn.execute("SELECT COUNT(*) FROM finalizadas").fetchone()[0]
    por_categoria = conn.execute(
        "SELECT categoria, COUNT(*) as total FROM promos WHERE ativa=1 GROUP BY categoria"
    ).fetchall()
    por_loja = conn.execute(
        "SELECT loja, COUNT(*) as total FROM promos WHERE ativa=1 GROUP BY loja ORDER BY total DESC LIMIT 6"
    ).fetchall()
    conn.close()
    return {
        "ativas": ativas,
        "cupons": cupons,
        "max_desconto": max_desc,
        "finalizadas": finalizadas,
        "por_categoria": {r["categoria"]: r["total"] for r in por_categoria},
        "por_loja": {r["loja"]: r["total"] for r in por_loja},
        "ultima_atualizacao": datetime.now().isoformat(),
    }


def registrar_log(tipo: str, mensagem: str):
    conn = get_conn()
    conn.execute(
        "INSERT INTO logs (tipo, mensagem, criado_em) VALUES (?,?,?)",
        (tipo, mensagem, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()


def incrementar_view(promo_id: str):
    conn = get_conn()
    conn.execute("UPDATE promos SET views=views+1 WHERE id=?", (promo_id,))
    conn.commit()
    conn.close()
