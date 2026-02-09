import json
import os
import logging
from pathlib import Path
import time

from urllib.parse import quote

from dotenv import load_dotenv

# Carregar .env logo no início (raiz do projeto e saas_server) para garantir SUPABASE_KEY
_main_dir = Path(__file__).resolve().parent
_project_root = _main_dir.parent
load_dotenv(_project_root / ".env", override=True)
load_dotenv(_main_dir / ".env", override=True)
if os.getenv("SUPABASE_KEY"):
    print("SUPABASE_KEY carregada (backend pronto para flows/Supabase)")
else:
    print("SUPABASE_KEY nao encontrada. Crie .env na raiz com SUPABASE_URL e SUPABASE_KEY.")

import httpx
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime

from saas_tools.config import settings
from saas_tools.api.tools import router as tools_router
from saas_tools.api.assistants import router as assistants_router
from saas_tools.api.dashboard import router as dashboard_router
from saas_tools.api.flows import router as flows_router
from saas_tools.api.grazi import router as grazi_router

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

ROOT = Path(__file__).resolve().parents[1]  # workspace root
SAAS_ROOT = ROOT  # static SaaS lives in workspace root
TOOLS_UI_DIR = ROOT / "menu_principal" / "assistentes" / "tools"
# Flow Editor - Frontend React com multi-paths (servido em /flow)
FLOW_DIST_DIR = ROOT / "flow_editor_frontend" / "dist"
if not FLOW_DIST_DIR.exists():
    print(f"Flow Editor frontend nao encontrado em {FLOW_DIST_DIR}. Execute 'npm run build' em flow_editor_frontend")
else:
    print(f"Flow Editor: {FLOW_DIST_DIR}")

app = FastAPI(title="Salesdever SaaS", version="1.0.0")

def _debug_log(location: str, message: str, data: dict, hypothesis_id: str) -> None:
    try:
        log_path = ROOT / ".cursor" / "debug.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": hypothesis_id,
            "location": location,
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
        }
        with log_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception:
        pass

_debug_log(
    "saas_server/main.py:startup",
    "server startup",
    {"flow_dist_exists": FLOW_DIST_DIR.exists()},
    "H0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIs do tools manager (igual vapi-tools-manager, agora dentro do SaaS)
app.include_router(tools_router, prefix="/api")
app.include_router(assistants_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(flows_router, prefix="/api")
app.include_router(grazi_router, prefix="/api")

# ⚠️ IMPORTANTE: Rotas específicas DEVEM vir ANTES dos mounts
# Rotas de páginas principais
@app.get("/")
def root():
    """Página inicial do sistema SaaS completo (login)."""
    return FileResponse(str(SAAS_ROOT / "index.html"))


@app.get("/index.html")
def index_html():
    """Alias para index.html."""
    return FileResponse(str(SAAS_ROOT / "index.html"))


# Páginas HTML na raiz do SaaS (login, criar conta, etc.)
@app.get("/criar-conta.html")
def criar_conta():
    return FileResponse(str(SAAS_ROOT / "criar-conta.html"))


@app.get("/forms.html")
def forms():
    return FileResponse(str(SAAS_ROOT / "forms.html"))


@app.get("/webhooks.html")
def webhooks():
    return FileResponse(str(SAAS_ROOT / "webhooks.html"))


@app.get("/menu.html")
def menu_root():
    """Menu na raiz: redireciona para /menu_principal/menu.html."""
    return RedirectResponse(url="/menu_principal/menu.html", status_code=302)


@app.get("/menu_principal/assistentes/assistente-editor.html")
def redirect_old_assistente_editor(
    assistente_id: str | None = Query(None),
    tenant_id: str | None = Query(None),
):
    """Redireciona o front antigo (assistente-editor.html) para o novo Flow Editor."""
    params = []
    if assistente_id:
        params.append(f"assistente_id={quote(assistente_id, safe='')}")
    if tenant_id:
        params.append(f"tenant_id={quote(tenant_id, safe='')}")
    qs = "&".join(params)
    url = f"/flow/flow-editor?{qs}" if qs else "/flow/flow-editor"
    return RedirectResponse(url=url, status_code=302)


@app.get("/health")
def health():
    _debug_log(
        "saas_server/main.py:health",
        "health check",
        {"path": "/health"},
        "H0",
    )
    vapi_dir = FLOW_DIST_DIR / "vapi-tools"
    return {
        "status": "ok",
        "marker": "vapi-tools-route-v2",
        "flow_dist_exists": FLOW_DIST_DIR.exists(),
        "vapi_tools_exists": vapi_dir.exists(),
        "vapi_index_exists": (vapi_dir / "index.html").is_file(),
    }


# VAPI Tools UI (build dentro do flow_editor_frontend/dist/vapi-tools)
@app.get("/vapi-tools")
def vapi_tools_root():
    _debug_log(
        "saas_server/main.py:vapi_tools_root",
        "redirect vapi tools root",
        {"path": "/vapi-tools"},
        "H1",
    )
    return RedirectResponse(url="/vapi-tools/index.html", status_code=302)


@app.get("/vapi-tools/{full_path:path}")
def vapi_tools_assets(full_path: str):
    try:
        base_dir = FLOW_DIST_DIR / "vapi-tools"
        file_path = base_dir / full_path
        _debug_log(
            "saas_server/main.py:vapi_tools_assets",
            "serve vapi tools asset",
            {
                "full_path": full_path,
                "base_exists": base_dir.exists(),
                "is_file": file_path.is_file(),
            },
            "H1",
        )
        if base_dir.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        raise HTTPException(status_code=404, detail="Not Found")
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("VAPI Tools: erro ao servir %s: %s", full_path, e)
        raise HTTPException(status_code=500, detail="Erro ao carregar VAPI Tools")


@app.post("/api/flow-editor/snapshot")
def save_flow_editor_snapshot(payload: dict = Body(...)) -> dict:
    """Salva um snapshot do Flow Editor em arquivo local para inspeção."""
    try:
        snapshots_dir = ROOT / "flow_editor_snapshots"
        snapshots_dir.mkdir(parents=True, exist_ok=True)
        assistente_id = payload.get("assistente_id") or "sem_assistente"
        ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        filename = f"snapshot_{assistente_id}_{ts}.json"
        file_path = snapshots_dir / filename
        file_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return {"success": True, "file": str(file_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar snapshot: {e}")


@app.get("/api/flow-editor/snapshot/latest")
def get_latest_flow_editor_snapshot(assistente_id: str = Query("TEMP")) -> dict:
    """Retorna o snapshot mais recente para um assistente (padrão TEMP)."""
    try:
        snapshots_dir = ROOT / "flow_editor_snapshots"
        if not snapshots_dir.exists():
            raise HTTPException(status_code=404, detail="Nenhum snapshot encontrado")
        pattern = f"snapshot_{assistente_id}_*.json"
        files = list(snapshots_dir.glob(pattern))
        if not files:
            raise HTTPException(status_code=404, detail="Nenhum snapshot encontrado")
        latest = max(files, key=lambda p: p.stat().st_mtime)
        data = json.loads(latest.read_text(encoding="utf-8"))
        return {"success": True, "snapshot": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler snapshot: {e}")


VERCALLS_WEBHOOK_URL = os.getenv(
    "VERCALLS_WEBHOOK_URL",
    "https://sdr.salesdever.io/webhook/vercalls-saas",
)

LOGIN_WEBHOOK_URL = os.getenv(
    "LOGIN_WEBHOOK_URL",
    "https://sdr.salesdever.io/webhook/recebe-login-",
)


@app.post("/api/auth/login")
async def proxy_login(body: dict):
    """
    Proxy para o webhook de login (recebe-login-).
    Evita timeout no browser e CORS; o servidor espera até 45s pela resposta do webhook/DB.
    Body esperado: { "login": "...", "senha": "..." }
    """
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            r = await client.post(
                LOGIN_WEBHOOK_URL,
                json=body,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
            r.raise_for_status()
            return r.json()
    except httpx.TimeoutException as e:
        logging.warning("proxy_login: timeout ao chamar webhook: %s", e)
        raise HTTPException(status_code=504, detail="O servidor de login demorou muito para responder. Tente novamente.")
    except Exception as e:
        logging.warning("proxy_login falhou: %s", e)
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/api/webhook/vercalls")
async def proxy_vercalls(body: dict):
    """Proxy para o webhook vercalls-saas (evita CORS ao chamar do browser). Em falha, retorna lista vazia para não quebrar a UI."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                VERCALLS_WEBHOOK_URL,
                json=body,
                headers={"Content-Type": "application/json"},
            )
            r.raise_for_status()
            return r.json()
    except Exception as e:
        # Evitar que a página de assistentes quebre: retornar estrutura vazia
        import logging
        logging.getLogger(__name__).warning("proxy_vercalls falhou: %s", e)
        return {"calls": [], "total": 0}


# Rotas UI Tools (sem iframe, mesmo domínio)
@app.get("/tools/gerenciar-tools")
def tools_page():
    return FileResponse(str(TOOLS_UI_DIR / "gerenciar-tools.html"))


@app.get("/tools/setup-tenant")
def tools_setup_tenant():
    return FileResponse(str(TOOLS_UI_DIR / "setup-tenant.html"))


def _flow_index_html() -> str:
    """Lê index.html do flow e injeta config do Supabase para o frontend (evita 401)."""
    path = FLOW_DIST_DIR / "index.html"
    if not path.is_file():
        raise FileNotFoundError(f"index.html não encontrado em {path}")
    html = path.read_text(encoding="utf-8")
    anon_key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_KEY
    if anon_key:
        config = {"supabase_url": settings.SUPABASE_URL, "supabase_anon_key": anon_key}
        script = f'<script>window.__SUPABASE_CONFIG__ = {json.dumps(config)};</script>'
        html = html.replace("</head>", script + "\n  </head>")
    return html


def _flow_html_response():
    """Retorna HTML do flow editor ou resposta de erro amigável (evita 500 genérico)."""
    try:
        return HTMLResponse(_flow_index_html())
    except FileNotFoundError as e:
        logging.warning("Flow Editor: %s", e)
        body = (
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Flow Editor</title></head><body style='font-family:sans-serif;padding:2rem;'>"
            "<h1>Flow Editor não disponível</h1><p>O build do frontend não foi encontrado.</p>"
            "<p>Execute no terminal: <code>cd flow_editor_frontend && npm run build</code></p>"
            "<p>Depois reinicie o servidor.</p></body></html>"
        )
        return HTMLResponse(content=body, status_code=503)
    except Exception as e:
        logging.exception("Flow Editor: erro ao servir index.html: %s", e)
        body = (
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Erro</title></head><body style='font-family:sans-serif;padding:2rem;'>"
            "<h1>Erro ao carregar o Flow Editor</h1><p>%s</p><p>Verifique os logs do servidor.</p></body></html>"
        ) % (str(e).replace("<", "&lt;").replace(">", "&gt;"))
        return HTMLResponse(content=body, status_code=503)


@app.get("/flow")
@app.get("/flow/")
def flow_root():
    return _flow_html_response()


@app.get("/flow/{full_path:path}")
def flow_spa(full_path: str):
    """
    SPA catch-all: rotas como /flow/flow-editor, /flow/agentes etc. servem index.html.
    Arquivos estáticos (assets/, favicon.ico, etc.) são servidos do dist.
    """
    try:
        _debug_log(
            "saas_server/main.py:flow_spa",
            "flow spa request",
            {"full_path": full_path},
            "H4",
        )
        # Arquivo estático (assets, favicon, etc.)
        if full_path.startswith("assets/") or full_path in ("favicon.ico", "robots.txt", "placeholder.svg"):
            file_path = FLOW_DIST_DIR / full_path
            if FLOW_DIST_DIR.exists() and file_path.is_file():
                return FileResponse(str(file_path))
            raise HTTPException(status_code=404, detail="Not Found")
        # Qualquer outro path (flow-editor, agentes, etc.) → index.html com config injetada
        return _flow_html_response()
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Flow SPA: erro inesperado para path=%s: %s", full_path, e)
        body = (
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Erro</title></head><body style='font-family:sans-serif;padding:2rem;'>"
            "<h1>Flow Editor temporariamente indisponível</h1><p>Reinicie o servidor e execute: <code>cd flow_editor_frontend && npm run build</code></p></body></html>"
        )
        return HTMLResponse(content=body, status_code=503)


# Servir o SaaS estático inteiro (mounts DEVEM vir DEPOIS das rotas específicas)
# NÃO montar /flow aqui: as rotas @app.get("/flow") e @app.get("/flow/{full_path:path}") já servem
# o index.html do SPA e arquivos estáticos (assets/, favicon) via flow_spa(). O mount capturava
# tudo e devolvia 500/404 para /flow/flow-editor.
app.mount("/menu_principal", StaticFiles(directory=str(ROOT / "menu_principal")), name="menu_principal")
app.mount("/static", StaticFiles(directory=str(TOOLS_UI_DIR / "static")), name="tools_static")
vapi_tools_dir = FLOW_DIST_DIR / "vapi-tools"
if vapi_tools_dir.is_dir():
    app.mount("/vapi-tools", StaticFiles(directory=str(vapi_tools_dir)), name="vapi_tools_ui")
else:
    logging.warning("VAPI Tools UI não disponível: %s não encontrado. Execute 'npm run build' em flow_editor_frontend.", vapi_tools_dir)


if __name__ == "__main__":
    import os
    import socket
    import uvicorn
    default_port = 8000  # porta fixa para sempre abrir no mesmo endereço
    port = int(os.environ.get("PORT", default_port))
    if port == 0:
        for p in range(8000, 8010):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(("127.0.0.1", p))
                port = p
                break
            except OSError:
                continue
        if port == 0:
            port = default_port
    url = f"http://127.0.0.1:{port}"
    logging.info("Servidor SaaS rodando em %s", url)
    print("\n" + "=" * 60)
    print(f"  SaaS disponível em:  {url}")
    print(f"  Health:             {url}/health")
    print(f"  Flow Editor:        {url}/flow")
    print("=" * 60 + "\n")
    uvicorn.run(app, host="127.0.0.1", port=port)

