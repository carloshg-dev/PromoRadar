# 📡 promodetec — Guia Completo

## O que é este projeto?

Sistema completo de monitoramento de promoções em tempo real.
O Python raspa as lojas automaticamente, salva no banco local,
e o HTML exibe tudo com preços verificados e links diretos.

---

## Estrutura do Projeto

```
promodetec_COMPLETO/
│
├── promodetec.html          ← Interface web — abra no Chrome/Edge
│
└── backend/
    ├── INICIAR.bat          ← Clique 2x para iniciar tudo (Windows)
    ├── scheduler.py         ← Motor principal — roda scrapers a cada 15min
    ├── requirements.txt     ← Dependências Python
    │
    ├── scrapers/
    │   ├── base.py          ← Classe base (todos os scrapers herdam dela)
    │   ├── mercadolivre.py  ← API pública do ML (mais confiável)
    │   ├── kabum.py         ← API REST da Kabum
    │   ├── pichau.py        ← HTML scraping da Pichau
    │   ├── leroymerlin.py   ← API + HTML Leroy Merlin
    │   └── magazineluiza.py ← HTML scraping Magalu
    │
    ├── api/
    │   └── server.py        ← FastAPI local — porta 8765
    │
    ├── database/
    │   └── db.py            ← Gerenciador SQLite local
    │
    └── logs/                ← Logs de execução (criado automaticamente)
```

---

## Instalação (fazer apenas 1 vez)

### Pré-requisito: Python 3.10+
→ https://www.python.org/downloads/
→ Marque **"Add Python to PATH"** durante a instalação

### No CMD/PowerShell, dentro da pasta `backend/`:
```bash
pip install -r requirements.txt
playwright install chromium
```

---

## Como Usar Todo Dia

### 1. Inicie o backend
```
Duplo clique em: backend/INICIAR.bat
```
Ou no terminal:
```bash
cd backend
python scheduler.py
```

### 2. Abra o app
```
Duplo clique em: promodetec.html
```
O badge no topo ficará **✅ ONLINE** quando conectado.

---

## Como Funciona

```
Sites das lojas
      ↓
 Python Scrapers  ──→  coleta preços reais a cada 15 min
      ↓
 SQLite Local    ──→  salva em database/promodetec.db
      ↓
 FastAPI :8765   ──→  API local que o HTML consome
      ↓
 promodetec.html ──→  exibe promoções com links diretos
```

---

## Lojas Monitoradas

| Loja           | Método         | Categorias Cobertas                     |
|----------------|----------------|-----------------------------------------|
| Mercado Livre  | API Pública    | Eletrônicos, Hardware, Automotivo       |
| Kabum          | API REST       | Hardware, PCs, Periféricos              |
| Pichau         | HTML Scraping  | Hardware, Notebooks                     |
| Leroy Merlin   | API + HTML     | Ferramentas, Casa                       |
| Magazine Luiza | HTML Scraping  | Eletrodomésticos, Eletrônicos           |

---

## API Local — Endpoints Disponíveis

| Método | Endpoint                          | O que faz                          |
|--------|-----------------------------------|------------------------------------|
| GET    | /promos                           | Todas as promoções ativas          |
| GET    | /promos?categoria=hardware        | Filtra por categoria               |
| GET    | /promos?busca=notebook            | Busca por texto                    |
| GET    | /promos?min_desc=30               | Desconto mínimo (%)                |
| GET    | /promos?max_preco=2000            | Preço máximo (R$)                  |
| GET    | /promos?loja=Kabum                | Filtra por loja                    |
| GET    | /finalizadas                      | Promoções encerradas (últimas 48h) |
| GET    | /stats                            | Estatísticas do banco              |
| GET    | /health                           | Status da API                      |

Acesse em: **http://localhost:8765**

---

## Configurações (backend/scheduler.py)

```python
INTERVALO_SCRAPING = 15   # raspa lojas a cada 15 minutos
INTERVALO_LIMPEZA  = 60   # limpa promos antigas a cada 1 hora
```

---

## Adicionar Nova Loja

1. Crie `backend/scrapers/nome_loja.py` herdando de `BaseScraper`
2. Implemente o método `raspar()` retornando lista de promos
3. Adicione ao array `SCRAPERS` em `backend/scheduler.py`

---

## Solução de Problemas

| Problema | Solução |
|---|---|
| Badge "⚠ OFFLINE" | Inicie o `INICIAR.bat` primeiro |
| Poucas promoções | Aguarde — o scraper coleta no primeiro minuto |
| Loja bloqueou o scraper | Normal — aguarde o próximo ciclo (15 min) |
| Erro ao instalar | Verifique se Python está no PATH |

---

## Segurança

- Tudo roda **100% local** no seu computador
- Nenhum dado enviado para servidores externos
- API só aceita conexões de `127.0.0.1` (localhost)
- Banco de dados salvo em `backend/database/promodetec.db`

---

**promodetec v2.0** — Sistema de automação local de promoções
