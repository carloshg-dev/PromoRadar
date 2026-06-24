"""
api/server.py — Servidor FastAPI local
Expõe os dados do banco para o PromoRadar HTML via http://localhost:8765
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database.db import (
    get_promos, get_finalizadas, get_stats,
    finalizar_promo, incrementar_view, init_db
)
from datetime import datetime

app = FastAPI(
    title="PromoRadar API Local",
    description="API local que alimenta o PromoRadar com promoções reais",
    version="1.0.0"
)

# Permite que o HTML aberto localmente acesse a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    print("\n✅ PromoRadar API rodando em http://localhost:8765")
    print("   Abra o PromoRadar.html no navegador\n")


@app.get("/")
def raiz():
    stats = get_stats()
    return {
        "status": "online",
        "api": "PromoRadar Local",
        "promos_ativas": stats["ativas"],
        "ultima_atualizacao": stats["ultima_atualizacao"],
    }


@app.get("/promos")
def listar_promos(
    categoria: str = Query(None, description="all | eletronicos | hardware | eletrodomesticos | automotivo | ferramentas | casa"),
    loja:      str = Query(None),
    min_desc:  int = Query(0,    ge=0, le=100),
    max_preco: float = Query(None, ge=0),
    busca:     str = Query(None),
    limit:     int = Query(100,  ge=1, le=500),
):
    promos = get_promos(
        categoria=categoria if categoria != "all" else None,
        loja=loja,
        min_desc=min_desc,
        max_preco=max_preco,
        busca=busca,
    )
    return {
        "total": len(promos[:limit]),
        "promos": promos[:limit],
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/promos/{promo_id}")
def detalhe_promo(promo_id: str):
    promos = get_promos()
    p = next((x for x in promos if x["id"] == promo_id), None)
    if not p:
        return JSONResponse(status_code=404, content={"erro": "Promoção não encontrada"})
    incrementar_view(promo_id)
    return p


@app.get("/finalizadas")
def listar_finalizadas():
    fin = get_finalizadas()
    return {"total": len(fin), "finalizadas": fin}


@app.get("/stats")
def estatisticas():
    return get_stats()


@app.post("/promos/{promo_id}/finalizar")
def finalizar(promo_id: str, motivo: str = "manual"):
    finalizar_promo(promo_id, motivo)
    return {"ok": True, "id": promo_id}


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")
