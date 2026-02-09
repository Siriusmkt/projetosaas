"""
Grazi Prompt Manager API: Integração com Edge Function do Supabase
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import logging
import os
import json
import time

logger = logging.getLogger(__name__)

# #region agent log
def _debug_log(loc: str, msg: str, data: dict, hypothesis_id: str) -> None:
    try:
        path = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".cursor", "debug.log")
        path = os.path.normpath(os.path.abspath(path))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"location": loc, "message": msg, "data": data, "timestamp": int(time.time() * 1000), "runId": "run1", "hypothesisId": hypothesis_id}) + "\n")
    except Exception as ex:
        logger.warning("_debug_log failed: %s", ex)
# #endregion

router = APIRouter(tags=["grazi"])

# Configurações da Edge Function
EDGE_FUNCTION_URL = os.getenv(
    "GRAZI_EDGE_FUNCTION_URL",
    "https://gwjcgzeybqiyqezuswpt.supabase.co/functions/v1/smart-action"
)
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3amNnemV5YnFpeXFlenVzd3B0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ1NjAwOCwiZXhwIjoyMDc2MDMyMDA4fQ.nZm_itwJh84saA5m1QEKWvDqm1ekekA5zDJ-p-3zZZU"
)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")

# Timeout de 60 segundos (Edge Function pode demorar até 30-60s quando executa mudanças)
REQUEST_TIMEOUT = 60.0

# Blocos mínimos esperados pela Edge Function
MIN_PROMPT_BLOCKS = {
    "IDENT001": {
        "block_type": "identidade",
        "content": "Identidade da IA",
        "order_index": -20,
    },
    "PERS001": {
        "block_type": "personalidade",
        "content": "Personalidade da IA",
        "order_index": -19,
    },
}


class ChatMessage(BaseModel):
    """Mensagem do histórico de conversa"""
    role: str  # "user" ou "assistant"
    content: str


class GraziChatRequest(BaseModel):
    """Request para o chat da Grazi"""
    assistente_id: str
    tenant_id: Optional[str] = None
    message: str
    history: List[ChatMessage] = []
    pending_changes: List[Dict[str, Any]] = []


class GraziChatResponse(BaseModel):
    """Response do chat da Grazi"""
    success: bool
    modo: str  # "conversa" / "preview" / "executar" / "mostrar_fluxo"
    mensagem: str
    sugestoes: List[Dict[str, Any]] = []
    aguardando_confirmacao: bool = False
    acoes_executadas: List[Dict[str, Any]] = []
    # Quando modo="mostrar_fluxo", incluir uma lista de blocos para renderizar no chat
    fluxo_visual: Optional[List[Dict[str, Any]]] = None


async def _ensure_assistant_records(assistant_id: str, tenant_id: Optional[str]) -> None:
    """Garante registros mínimos para o assistente, se as tabelas existirem."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    profiles_payload = {
        "assistant_id": assistant_id,
        "identity": "",
        "personality": "",
        "phonetic_rules": "",
        "absolute_rules": "",
        "natural_expressions": "",
        "scheduling_rules": {},
    }
    flows_payload = {
        "assistant_id": assistant_id,
        "flow_json": {},
        "title": "",
        "description": "",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        for table, payload in (
            ("assistant_profiles", profiles_payload),
            ("assistant_flows", flows_payload),
        ):
            try:
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/{table}?on_conflict=assistant_id",
                    headers=headers,
                    json=payload,
                )
            except Exception:
                # Se a tabela não existir ou falhar, segue sem bloquear o chat
                continue


def _ensure_minimum_prompt_blocks(assistant_id: str, tenant_id: Optional[str]) -> None:
    """Garante que IDENT001 e PERS001 existam no flow_blocks do assistente."""
    try:
        from saas_tools.services import flow_service
        from saas_tools.services.supabase_service import supabase_service

        client = supabase_service._require_client()
        flow = flow_service.get_flow_by_assistant(assistant_id)
        if not flow and tenant_id:
            flow = flow_service.create_flow(tenant_id=tenant_id, name="Flow Grazi", assistente_id=assistant_id)
        if not flow:
            return

        flow_id = flow.get("id")
        if not flow_id:
            return

        resp = (
            client.table("flow_blocks")
            .select("block_key")
            .eq("flow_id", flow_id)
            .execute()
        )
        existing = {b.get("block_key") for b in (resp.data or [])}
        inserts = []
        for block_key, data in MIN_PROMPT_BLOCKS.items():
            if block_key in existing:
                continue
            payload = {
                "flow_id": flow_id,
                "assistente_id": assistant_id,
                "block_key": block_key,
                "block_type": data["block_type"],
                "content": data["content"],
                "order_index": data["order_index"],
            }
            if tenant_id:
                payload["tenant_id"] = tenant_id
            inserts.append(payload)

        if inserts:
            client.table("flow_blocks").insert(inserts).execute()
    except Exception:
        # Não bloquear o chat se algo falhar aqui
        return


@router.post("/grazi/chat", response_model=GraziChatResponse)
async def grazi_chat(request: GraziChatRequest) -> Dict[str, Any]:
    """
    Endpoint para conversar com a Grazi Prompt Manager.
    
    Recebe mensagem do usuário e retorna resposta da Grazi com preview/execução de mudanças.
    
    **Fluxo:**
    1. Usuário pede mudança → modo="preview", aguardando_confirmacao=true
    2. Usuário confirma ("sim", "pode") → modo="executar", acoes_executadas preenchido
    3. Usuário pergunta/explora → modo="conversa", sem mudanças
    
    **Parâmetros:**
    - assistente_id: UUID do assistente (obrigatório)
    - message: Mensagem atual do usuário (obrigatório)
    - history: Histórico de mensagens (últimas 10, opcional)
    - pending_changes: Mudanças aguardando confirmação (opcional)
    
    **Response:**
    - success: Se processou com sucesso
    - modo: "conversa" / "preview" / "executar"
    - mensagem: Resposta da Grazi para mostrar ao usuário
    - sugestoes: Preview das mudanças propostas (quando modo=preview)
    - aguardando_confirmacao: Se está esperando usuário confirmar
    - acoes_executadas: Resultado das mudanças (quando modo=executar)
    """
    try:
        # #region agent log
        _debug_log("grazi.py:grazi_chat:entry", "grazi_chat called", {"assistente_id": request.assistente_id[:8] + "..." if len(request.assistente_id or "") > 8 else request.assistente_id, "message_length": len(request.message or ""), "history_length": len(request.history or [])}, "H3")
        # #endregion
        logger.info(
            f"💬 [Grazi API] Recebendo mensagem - assistente_id={request.assistente_id}, "
            f"message_length={len(request.message)}, history_length={len(request.history)}"
        )
        
        # Validar parâmetros obrigatórios
        if not request.assistente_id or not request.assistente_id.strip():
            raise HTTPException(
                status_code=400,
                detail="assistente_id é obrigatório"
            )
        
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="message não pode estar vazia"
            )

        # Preparar payload para Edge Function
        payload = {
            "assistente_id": request.assistente_id.strip(),
            "assistant_id": request.assistente_id.strip(),
            "tenant_id": request.tenant_id.strip() if request.tenant_id else None,
            "tenantId": request.tenant_id.strip() if request.tenant_id else None,
            "message": request.message.strip(),
            "history": [msg.dict() for msg in request.history],
            "pending_changes": request.pending_changes
        }

        # Tentar garantir registros mínimos (se tabelas existirem)
        try:
            await _ensure_assistant_records(request.assistente_id.strip(), request.tenant_id)
        except Exception:
            pass
        # Garantir blocos mínimos para evitar "prompt não adaptado"
        _ensure_minimum_prompt_blocks(request.assistente_id.strip(), request.tenant_id)
        
        logger.info(f"📤 [Grazi API] Chamando Edge Function: {EDGE_FUNCTION_URL}")
        # #region agent log
        _debug_log("grazi.py:before_post", "before Edge POST", {"url": EDGE_FUNCTION_URL, "payload_keys": list(payload.keys()), "has_tenant_id": bool(request.tenant_id)}, "H3")
        # #endregion
        # Chamar Edge Function do Supabase
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(
                EDGE_FUNCTION_URL,
                headers={
                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
        # #region agent log
        _debug_log("grazi.py:after_post", "Edge response", {"status_code": response.status_code, "body_preview": (response.text or "")[:500] if response.status_code != 200 else "ok"}, "H1")
        # #endregion
        # Verificar status da resposta
        if response.status_code != 200:
                error_detail = f"Edge Function retornou status {response.status_code}"
                try:
                    error_body = response.json()
                    # #region agent log
                    _debug_log("grazi.py:error_body_parsed", "Edge error body (JSON)", {"error_detail": error_body.get("error") or error_body.get("message"), "keys": list(error_body.keys())}, "H1")
                    # #endregion
                    # Verificar se é erro de função não encontrada
                    if error_body.get("code") == "NOT_FOUND" or "not found" in error_body.get("message", "").lower():
                        error_detail = (
                            "Edge Function não encontrada no Supabase. "
                            "Verifique se a função foi deployada e se o nome na URL está correto."
                        )
                        logger.error(f"❌ [Grazi API] Edge Function não encontrada: {error_body}")
                        raise HTTPException(
                            status_code=503,
                            detail=error_detail
                        )
                    error_detail = error_body.get("error", error_body.get("message", error_detail))
                except HTTPException:
                    raise
                except Exception as parse_err:
                    error_detail = response.text[:500] if response.text else error_detail
                    # #region agent log
                    _debug_log("grazi.py:error_body_parse_failed", "response.json() failed", {"parse_error": str(parse_err), "raw_preview": (response.text or "")[:300]}, "H5")
                    # #endregion
                
                logger.error(f"❌ [Grazi API] Erro na Edge Function: {error_detail}")
                # Mensagem mais clara quando a IA falha (API key, timeout ou serviço fora)
                if "IA" in (error_detail or "") or "processar com ia" in (error_detail or "").lower():
                    hint = (
                        " Verifique na Edge Function (Supabase): variáveis de ambiente da API da IA (OpenAI/Anthropic), "
                        "logs da função e conectividade com o provedor."
                    )
                    error_detail = (error_detail or "").strip() + hint
                # Se for 404, retornar 503 (Service Unavailable) ao invés de 404
                status_code = 503 if response.status_code == 404 else response.status_code
                raise HTTPException(
                    status_code=status_code,
                    detail=f"Erro ao processar mensagem: {error_detail}"
                )
        
        # Parse da resposta
        result = response.json()
        logger.info(
            f"✅ [Grazi API] Resposta recebida - modo={result.get('modo', 'unknown')}, "
            f"aguardando_confirmacao={result.get('aguardando_confirmacao', False)}, "
            f"sugestoes={len(result.get('sugestoes', []))}"
        )
        
        # Validar estrutura básica da resposta
        if not isinstance(result, dict):
            raise HTTPException(
                status_code=500,
                detail="Resposta inválida da Edge Function"
            )
        
        # Garantir campos obrigatórios
        response_data = {
            "success": result.get("success", True),
            "modo": result.get("modo", "conversa"),
            "mensagem": result.get("mensagem", ""),
            "sugestoes": result.get("sugestoes", []),
            "aguardando_confirmacao": result.get("aguardando_confirmacao", False),
            "acoes_executadas": result.get("acoes_executadas", []),
            "fluxo_visual": result.get("fluxo_visual"),
        }

        # Aplicar ações da Grazi no backend (flow_blocks com tenant_id/flow_id corretos)
        # quando a Edge retorna acoes_para_executar (evita "1 com erro" por falta de tenant_id na Edge)
        if result.get("modo") == "executar":
            acoes_para_exec = result.get("acoes_para_executar")
            if acoes_para_exec:
                logger.info(
                    "🔧 [Grazi API] modo=executar com acoes_para_executar: %d ação(ões). Aplicando no backend.",
                    len(acoes_para_exec) if isinstance(acoes_para_exec, list) else 1,
                )
            else:
                logger.warning(
                    "⚠️ [Grazi API] modo=executar mas acoes_para_executar vazio ou ausente. Edge não enviou ações."
                )
        if result.get("modo") == "executar" and result.get("acoes_para_executar"):
            from saas_tools.services import flow_service
            try:
                acoes_executadas = flow_service.apply_grazi_actions(
                    assistente_id=request.assistente_id.strip(),
                    tenant_id=request.tenant_id.strip() if request.tenant_id else None,
                    acoes_para_executar=result["acoes_para_executar"],
                    flow_id=result.get("flow_id"),
                )
                response_data["acoes_executadas"] = acoes_executadas
                sucessos = sum(1 for a in acoes_executadas if a.get("success"))
                falhas = len(acoes_executadas) - sucessos
                if falhas == 0:
                    response_data["mensagem"] = (response_data["mensagem"] or "") + (
                        "\n\n✅ **Pronto!** "
                        f"{sucessos} alteração(ões) aplicada(s). As mudanças já estão valendo!"
                    )
                else:
                    response_data["mensagem"] = (response_data["mensagem"] or "") + (
                        f"\n\n⚠️ **{sucessos} ok, {falhas} com erro.** Tenta de novo?"
                    )
            except Exception as e:
                logger.exception("Grazi: falha ao aplicar acoes_para_executar: %s", e)
                response_data["acoes_executadas"] = [
                    {"acao": "apply", "block_key": "", "success": False, "error": str(e)}
                ]
                response_data["mensagem"] = (response_data["mensagem"] or "") + (
                    "\n\n⚠️ Erro ao aplicar mudanças no servidor. Tenta de novo?"
                )

        return response_data
            
    except httpx.TimeoutException as e:
        # #region agent log
        _debug_log("grazi.py:timeout", "Edge timeout", {"error": str(e)}, "H2")
        # #endregion
        logger.error(f"⏱️ [Grazi API] Timeout ao chamar Edge Function (>{REQUEST_TIMEOUT}s)")
        raise HTTPException(
            status_code=504,
            detail=f"Timeout: A Edge Function demorou mais de {REQUEST_TIMEOUT} segundos para responder. "
                   "Isso pode acontecer quando há muitas mudanças sendo executadas."
        )
    
    except httpx.RequestError as e:
        # #region agent log
        _debug_log("grazi.py:request_error", "Edge request/connection error", {"error": str(e), "type": type(e).__name__}, "H2")
        # #endregion
        logger.error(f"🌐 [Grazi API] Erro de conexão: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Erro ao conectar com Edge Function: {str(e)}"
        )
    
    except HTTPException:
        # Re-raise HTTPExceptions (já tratadas acima)
        raise
    
    except Exception as e:
        # #region agent log
        _debug_log("grazi.py:exception", "Unexpected exception", {"error": str(e), "type": type(e).__name__}, "H4")
        # #endregion
        logger.error(f"❌ [Grazi API] Erro inesperado: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao processar mensagem: {str(e)}"
        )


@router.get("/grazi/health")
async def grazi_health() -> Dict[str, Any]:
    """
    Endpoint de health check para verificar conectividade com Edge Function.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            base_url = EDGE_FUNCTION_URL.rsplit("/", 1)[0]
            response = await client.get(
                f"{base_url}/health",
                headers={"Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"},
            )
            return {
                "status": "ok" if response.status_code == 200 else "error",
                "edge_function_url": EDGE_FUNCTION_URL,
                "reachable": response.status_code == 200
            }
    except Exception as e:
        return {
            "status": "error",
            "edge_function_url": EDGE_FUNCTION_URL,
            "reachable": False,
            "error": str(e)
        }
