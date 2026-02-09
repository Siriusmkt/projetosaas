from fastapi import APIRouter, HTTPException, Query
from typing import Any, Dict, List, Optional, Tuple
import json
import logging
import re

from saas_tools.models.schemas import (
    AssistantProfileUpsert,
    AssistantFlowUpsert,
    PromptImportParseRequest,
    FirstMessageUpdate,
    PromptMasterUpdate,
    VoiceSpeedUpdate,
)
from saas_tools.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["assistants"])

# Mapeamento: campo extraído do parse → (block_key, block_type, order_index)
# Fonte de verdade: flow_blocks. O trigger no banco reconstrói prompt_voz.
CONFIG_BLOCK_MAP: Dict[str, Tuple[str, str, int]] = {
    "identity": ("IDENT001", "identidade", -20),
    "personality": ("PERS001", "personalidade", -19),
    "phonetic_rules": ("PRON001", "pronuncia", -18),
    "absolute_rules": ("REGR001", "regras", -17),
    "natural_expressions": ("EXPR001", "expressoes", -16),
    "scheduling_rules": ("AGEN001", "agendamento", -15),
}


def _normalize_heading(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip()).upper()


def _split_markdown_sections(text: str) -> List[Tuple[str, str]]:
    """
    Split by markdown headings (#/##/###). Returns list of (heading, body).
    If no headings exist, returns single ("", text).
    """
    lines = text.splitlines()
    sections: List[Tuple[str, List[str]]] = []
    current_heading = ""
    current_body: List[str] = []

    heading_re = re.compile(r"^\s{0,3}(#{1,6})\s+(.*\S)\s*$")

    for line in lines:
        m = heading_re.match(line)
        if m:
            # flush previous
            if current_heading or current_body:
                sections.append((current_heading, current_body))
            current_heading = m.group(2).strip()
            current_body = []
        else:
            current_body.append(line)

    if current_heading or current_body:
        sections.append((current_heading, current_body))

    if not sections:
        return [("", text)]

    return [(h, "\n".join(b).strip()) for (h, b) in sections]


def parse_prompt_master(prompt_master: str) -> Dict[str, Any]:
    """
    Very lightweight heuristic parser.
    - Extracts global sections (identity/personality/phonetic/absolute/natural/scheduling)
    - Suggests a basic blocks list based on lines containing markers like:
      "ABERTURA", "PASSO", "AGUARDE", "AGUARDE RESPOSTA", "ENCERRAR", "CHAME TOOL"
    """
    sections = _split_markdown_sections(prompt_master)

    extracted: Dict[str, Any] = {
        "identity": "",
        "personality": "",
        "phonetic_rules": "",
        "absolute_rules": "",
        "natural_expressions": "",
        "scheduling_rules": {},
    }

    # Map common Portuguese headings to profile fields
    for heading, body in sections:
        h = _normalize_heading(heading)
        if not body:
            continue

        if any(k in h for k in ["IDENTIDADE", "PAPEL DA IA", "QUEM VOCÊ É", "SOBRE A IA"]):
            extracted["identity"] = body
        elif any(k in h for k in ["PERSONALIDADE", "TOM", "DIRETRIZES DE EXECUÇÃO", "DIRETRIZES"]):
            # keep existing if already set; otherwise set
            extracted["personality"] = extracted["personality"] or body
        elif any(k in h for k in ["PRONÚNCIA", "PRONUNCIA", "FONÉTICA", "FONETICA"]):
            extracted["phonetic_rules"] = body
        elif any(k in h for k in ["REGRAS ABSOLUTAS", "PROIBIÇÕES", "PROIBICOES", "NÃO NEGOCIÁVEIS", "NAO NEGOCIAVEIS"]):
            extracted["absolute_rules"] = body
        elif any(k in h for k in ["EXPRESSÕES", "EXPRESSOES", "CONECTIVOS"]):
            extracted["natural_expressions"] = body
        elif any(k in h for k in ["AGENDAMENTO", "AGENDA", "JANELA", "DIAS ÚTEIS", "DIAS UTEIS"]):
            # Try to keep raw in scheduling_rules.raw if unknown format
            extracted["scheduling_rules"] = {"raw": body}

    # Suggest blocks: scan lines for quoted scripts and markers
    suggested_blocks: List[Dict[str, Any]] = []
    lines = [ln.strip() for ln in prompt_master.splitlines() if ln.strip()]

    def push_text(msg: str):
        suggested_blocks.append(
            {
                "type": "texto",
                "content": msg.strip(),
            }
        )

    def push_first(msg: str):
        suggested_blocks.append(
            {
                "type": "primeira_mensagem",
                "content": msg.strip(),
            }
        )

    def push_wait(label: str = "Aguardar resposta", timeout: int = 30):
        suggested_blocks.append(
            {
                "type": "aguardar",
                "content": label,
                "timeout": timeout,
            }
        )

    def push_end(label: str = "Encerrar conversa"):
        suggested_blocks.append(
            {
                "type": "encerrar",
                "content": label,
            }
        )

    def push_tool(tool_name: str):
        # We do not know the toolType mapping here; leave placeholder
        suggested_blocks.append(
            {
                "type": "tool",
                "content": tool_name.strip(),
                "toolType": "salvar_dados",
            }
        )

    # Extract lines in quotes as "script" messages
    quote_re = re.compile(r'["“](.+?)["”]\s*$')
    first_message_set = False

    for ln in lines:
        up = ln.upper()

        if "AGUARDE" in up:
            push_wait("Aguardar resposta", 30)
            continue
        if "ENCERRAR" in up and "NÃO" not in up and "NAO" not in up:
            push_end()
            continue
        if "CHAME" in up and "TOOL" in up:
            # naive: CHAME tool X
            m = re.search(r"CHAME\s+TOOL\s+(.+)$", ln, re.IGNORECASE)
            push_tool(m.group(1) if m else "Chamar tool")
            continue

        m = quote_re.search(ln)
        if m:
            msg = m.group(1).strip()
            if msg:
                if not first_message_set:
                    push_first(msg)
                    first_message_set = True
                else:
                    push_text(msg)
            continue

    return {"extracted_globals": extracted, "suggested_blocks": suggested_blocks}


def _get_first_message(assistant_id: str) -> str:
    """Busca first_message na tabela assistentes. Tenta por assistente_id e por id."""
    if not assistant_id:
        return ""
    try:
        client = supabase_service._require_client()
        for col in ("assistente_id", "id"):
            try:
                ar = client.table("assistentes").select("first_message, primeira_mensagem").eq(col, assistant_id).limit(1).execute()
                if ar.data and len(ar.data) > 0:
                    row = ar.data[0]
                    msg = row.get("first_message") or row.get("primeira_mensagem")
                    if msg is not None:
                        return msg if isinstance(msg, str) else ""
            except Exception:
                try:
                    ar = client.table("assistentes").select("first_message").eq(col, assistant_id).limit(1).execute()
                    if ar.data and len(ar.data) > 0 and ar.data[0].get("first_message") is not None:
                        return ar.data[0].get("first_message") or ""
                except Exception:
                    continue
    except Exception as e:
        logger.warning("get_first_message: %s", e)
    return ""


@router.get("/assistants/{assistant_id}/first-message")
async def get_first_message(assistant_id: str):
    """Retorna a primeira mensagem do assistente (assistentes.first_message) para Configurações globais."""
    # #region agent log
    try:
        with open("/Users/patrickdiasparis/Downloads/salesdeverlab-main/.cursor/debug.log", "a") as f:
            f.write('{"timestamp":' + str(int(__import__("time").time() * 1000)) + ',"location":"assistants.py:get_first_message","message":"GET first-message entry","data":{"assistant_id":"' + str(assistant_id)[:36] + '"},"hypothesisId":"H1"}\n')
    except Exception:
        pass
    # #endregion
    return {"success": True, "first_message": _get_first_message(assistant_id)}


@router.patch("/assistants/{assistant_id}/first-message")
async def update_first_message(assistant_id: str, payload: FirstMessageUpdate):
    """Atualiza a primeira mensagem do assistente (assistentes.first_message). Tenta por assistente_id e por id."""
    try:
        from datetime import datetime
        client = supabase_service._require_client()
        payload_val = payload.first_message or ""
        for col in ("assistente_id", "id"):
            up = client.table("assistentes").update({
                "first_message": payload_val,
                "updated_at": datetime.utcnow().isoformat() + "Z",
            }).eq(col, assistant_id).execute()
            if up.data and len(up.data) > 0:
                return {"success": True, "first_message": payload_val}
        return {"success": False, "detail": "Nenhum registro atualizado"}
    except Exception as e:
        logger.error("Erro ao atualizar first_message: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assistants/{assistant_id}/info")
async def get_assistant_info(assistant_id: str):
    """Retorna nome e foto do assistente para exibir no flow editor (nome + url_perfil/avatar)."""
    try:
        info = supabase_service.get_assistant_info(assistant_id)
        return {"success": True, "name": info.get("name"), "photoUrl": info.get("photo_url")}
    except Exception as e:
        logger.error(f"Erro ao buscar info do assistente: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assistants/{assistant_id}/voice-settings")
async def get_voice_settings(assistant_id: str):
    """Retorna configurações de voz (voice_speed) da tabela assistentes."""
    try:
        client = supabase_service._require_client()
        for col in ("assistente_id", "id"):
            try:
                resp = (
                    client.table("assistentes")
                    .select("voice_speed")
                    .eq(col, assistant_id)
                    .limit(1)
                    .execute()
                )
                if resp.data and len(resp.data) > 0:
                    raw = resp.data[0].get("voice_speed")
                    speed = 1.0
                    if raw is not None:
                        try:
                            speed = float(raw)
                            speed = max(0.5, min(2.0, speed))
                        except (TypeError, ValueError):
                            pass
                    return {"success": True, "voice_speed": speed}
            except Exception:
                continue
        return {"success": True, "voice_speed": 1.0}
    except Exception as e:
        logger.error("Erro ao buscar voice_speed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/assistants/{assistant_id}/voice-settings")
async def update_voice_settings(assistant_id: str, payload: VoiceSpeedUpdate):
    """Atualiza voice_speed na tabela assistentes (0.5 a 2.0)."""
    try:
        from datetime import datetime

        client = supabase_service._require_client()
        speed = max(0.5, min(2.0, payload.voice_speed))
        for col in ("assistente_id", "id"):
            up = (
                client.table("assistentes")
                .update({
                    "voice_speed": speed,
                    "updated_at": datetime.utcnow().isoformat() + "Z",
                })
                .eq(col, assistant_id)
                .execute()
            )
            if up.data and len(up.data) > 0:
                return {"success": True, "voice_speed": speed}
        return {"success": False, "detail": "Nenhum registro atualizado"}
    except Exception as e:
        logger.error("Erro ao atualizar voice_speed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


def _get_tenant_id_from_env_or_query(tenant_id: Optional[str] = None) -> str:
    """Obtém tenant_id da query ou de variável de ambiente para fallback."""
    if tenant_id:
        return tenant_id
    import os
    return os.getenv("DEFAULT_TENANT_ID", "")


def _build_prompt_from_config_blocks(blocks: List[Dict[str, Any]]) -> str:
    """Monta o texto do prompt a partir dos blocos de config (order_index negativo)."""
    SECTION_NAMES: Dict[str, str] = {
        "identidade": "Identidade",
        "personalidade": "Personalidade",
        "pronuncia": "Pronúncia",
        "regras": "Regras absolutas",
        "expressoes": "Expressões naturais",
        "agendamento": "Agendamento",
    }
    sorted_blocks = sorted(
        [b for b in blocks if isinstance(b.get("order_index"), (int, float)) and b.get("order_index", 0) < 0],
        key=lambda b: b.get("order_index", 0)
    )
    parts: List[str] = []
    for b in sorted_blocks:
        bt = b.get("block_type") or ""
        content = (b.get("content") or "").strip()
        if not content:
            continue
        if bt == "agendamento" and content.startswith("{"):
            try:
                obj = json.loads(content)
                content = json.dumps(obj, ensure_ascii=False, indent=2)
            except Exception:
                pass
        section_name = SECTION_NAMES.get(bt, bt.replace("_", " ").title())
        parts.append(f"## {section_name}\n\n{content}")
    return "\n\n".join(parts) if parts else ""


@router.get("/assistants/{assistant_id}/prompt-master")
async def get_prompt_master(
    assistant_id: str,
    tenant_id: Optional[str] = Query(None, description="Tenant ID para buscar flow"),
):
    """
    Retorna o Prompt Master para a aba Configuração global.
    Fonte de verdade: flow_blocks (blocos com order_index negativo).
    O trigger no banco reconstrói prompt_voz quando blocos são alterados.
    """
    try:
        from saas_tools.services import flow_service

        client = supabase_service._require_client()
        final_tenant_id = _get_tenant_id_from_env_or_query(tenant_id) or None

        # 1) Buscar flow do assistente
        flow = flow_service.get_flow_by_assistant(assistant_id, final_tenant_id)
        if flow and flow.get("id"):
            flow_id = flow["id"]
            # 2) Buscar blocos de config (order_index < 0)
            resp = (
                client.table("flow_blocks")
                .select("block_key, block_type, content, order_index")
                .eq("flow_id", flow_id)
                .lt("order_index", 0)
                .order("order_index", desc=False)
                .execute()
            )
            blocks = resp.data or []
            if blocks:
                prompt_text = _build_prompt_from_config_blocks(blocks)
                if prompt_text:
                    return {"success": True, "prompt_voz": prompt_text}

        # 3) Fallback: assistentes.prompt_voz (legado)
        for col in ("assistente_id", "id"):
            try:
                resp = client.table("assistentes").select("prompt_voz").eq(col, assistant_id).limit(1).execute()
                if resp.data and len(resp.data) > 0:
                    prompt_voz = resp.data[0].get("prompt_voz") or ""
                    return {"success": True, "prompt_voz": prompt_voz}
            except Exception:
                continue
        return {"success": True, "prompt_voz": ""}
    except Exception as e:
        logger.error("Erro ao buscar prompt_master: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/assistants/{assistant_id}/prompt-master")
async def update_prompt_master(
    assistant_id: str,
    payload: PromptMasterUpdate,
    tenant_id: Optional[str] = Query(None, description="Tenant ID para salvar flow_blocks"),
):
    """
    Atualiza o Prompt Master salvando em flow_blocks (não em assistentes.prompt_voz).
    O trigger trigger_flow_blocks_unified dispara e o rapid-processor reconstrói prompt_voz.
    """
    try:
        from saas_tools.services import flow_service

        client = supabase_service._require_client()
        payload_val = payload.prompt_voz or ""
        final_tenant_id = _get_tenant_id_from_env_or_query(tenant_id) or None

        if not payload_val.strip():
            return {"success": True, "prompt_voz": ""}

        # 1) Parsear seções do prompt
        parsed = parse_prompt_master(payload_val)
        extracted = parsed.get("extracted_globals") or {}

        # 2) Obter ou criar flow
        flow = flow_service.get_or_create_flow_for_assistant(
            assistente_id=assistant_id,
            tenant_id=final_tenant_id or "default",
            name=f"Flow do assistente {assistant_id[:8] if len(assistant_id) >= 8 else assistant_id}",
        )
        if not flow or not flow.get("id"):
            logger.warning("Não foi possível obter flow para assistente %s", assistant_id)
            raise HTTPException(status_code=404, detail="Flow não encontrado e não foi possível criar")

        flow_id = flow["id"]
        assistente_id_flow = flow.get("assistente_id") or assistant_id
        tenant_id_flow = flow.get("tenant_id") or final_tenant_id or "default"

        # 3) UPSERT cada seção em flow_blocks
        for field_key, content in extracted.items():
            if field_key not in CONFIG_BLOCK_MAP:
                continue
            block_key, block_type, order_index = CONFIG_BLOCK_MAP[field_key]
            if field_key == "scheduling_rules":
                content_str = json.dumps(content, ensure_ascii=False) if isinstance(content, dict) else str(content)
            else:
                content_str = (content or "").strip() if isinstance(content, str) else str(content or "")

            row = {
                "flow_id": flow_id,
                "assistente_id": assistente_id_flow,
                "tenant_id": tenant_id_flow,
                "block_key": block_key,
                "block_type": block_type,
                "content": content_str,
                "order_index": order_index,
            }
            try:
                client.table("flow_blocks").upsert(
                    row,
                    on_conflict="flow_id,block_key",
                ).execute()
                logger.info("Config bloco %s salvo em flow_blocks", block_key)
            except Exception as upsert_err:
                logger.warning("Erro ao upsert bloco %s: %s", block_key, upsert_err)
                try:
                    existing = (
                        client.table("flow_blocks")
                        .select("id")
                        .eq("flow_id", flow_id)
                        .eq("block_key", block_key)
                        .limit(1)
                        .execute()
                    )
                    if existing.data:
                        client.table("flow_blocks").update({
                            "content": content_str,
                            "block_type": block_type,
                            "order_index": order_index,
                        }).eq("flow_id", flow_id).eq("block_key", block_key).execute()
                    else:
                        client.table("flow_blocks").insert(row).execute()
                except Exception as fallback_err:
                    logger.error("Fallback upsert falhou para %s: %s", block_key, fallback_err)

        return {"success": True, "prompt_voz": payload_val}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erro ao atualizar prompt_master: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assistants/{assistant_id}/profile")
async def get_profile(
    assistant_id: str,
    tenant_id: Optional[str] = Query(None, description="Tenant ID para flow_blocks"),
):
    """
    Retorna perfil do assistente. Se assistant_profiles vazio, tenta ler de flow_blocks.
    """
    try:
        profile = supabase_service.get_assistant_profile(assistant_id)
        if profile and any(profile.get(k) for k in ("identity", "personality", "absolute_rules")):
            return {"success": True, "profile": profile}

        # Fallback: ler de flow_blocks (fonte de verdade)
        try:
            from saas_tools.services import flow_service

            final_tenant_id = tenant_id or _get_tenant_id_from_env_or_query() or None
            flow = flow_service.get_flow_by_assistant(assistant_id, final_tenant_id)
            if flow and flow.get("id"):
                client = supabase_service._require_client()
                resp = (
                    client.table("flow_blocks")
                    .select("block_key, content")
                    .eq("flow_id", flow["id"])
                    .in_("block_key", ["IDENT001", "PERS001", "PRON001", "REGR001", "EXPR001", "AGEN001"])
                    .execute()
                )
                blocks = {b["block_key"]: b.get("content") or "" for b in (resp.data or [])}
                block_to_field = {
                    "IDENT001": "identity",
                    "PERS001": "personality",
                    "PRON001": "phonetic_rules",
                    "REGR001": "absolute_rules",
                    "EXPR001": "natural_expressions",
                    "AGEN001": "scheduling_rules",
                }
                profile_from_blocks: Dict[str, Any] = {
                    "assistant_id": assistant_id,
                    "identity": "",
                    "personality": "",
                    "phonetic_rules": "",
                    "absolute_rules": "",
                    "natural_expressions": "",
                    "scheduling_rules": {},
                    "voice_speed": 1.0,
                }
                for bk, fk in block_to_field.items():
                    val = blocks.get(bk, "")
                    if fk == "scheduling_rules":
                        try:
                            val = json.loads(val) if isinstance(val, str) and val.strip() else {}
                        except Exception:
                            val = {}
                    else:
                        val = (val or "").strip() if isinstance(val, str) else str(val or "")
                    profile_from_blocks[fk] = val
                if any(profile_from_blocks.get(k) for k in ("identity", "personality", "absolute_rules")):
                    return {"success": True, "profile": profile_from_blocks}
        except Exception as fb_err:
            logger.debug("Fallback flow_blocks para profile: %s", fb_err)

        return {"success": True, "profile": profile or {"assistant_id": assistant_id}}
    except Exception as e:
        logger.error("Erro ao buscar assistant_profile: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/assistants/{assistant_id}/profile")
async def upsert_profile(
    assistant_id: str,
    payload: AssistantProfileUpsert,
    tenant_id: Optional[str] = Query(None, description="Tenant ID para flow_blocks"),
):
    """
    Salva perfil do assistente. Também faz UPSERT em flow_blocks (fonte de verdade).
    O trigger no banco reconstrói prompt_voz quando blocos são alterados.
    """
    try:
        saved = supabase_service.upsert_assistant_profile(assistant_id, payload.model_dump())

        # Salvar em flow_blocks (fonte de verdade para prompt da IA)
        try:
            from saas_tools.services import flow_service

            client = supabase_service._require_client()
            final_tenant_id = tenant_id or _get_tenant_id_from_env_or_query() or "default"
            flow = flow_service.get_or_create_flow_for_assistant(
                assistente_id=assistant_id,
                tenant_id=final_tenant_id,
                name=f"Flow do assistente {assistant_id[:8] if len(assistant_id) >= 8 else assistant_id}",
            )
            if flow and flow.get("id"):
                flow_id = flow["id"]
                assistente_id_flow = flow.get("assistente_id") or assistant_id
                tenant_id_flow = flow.get("tenant_id") or final_tenant_id

                profile_to_block: Dict[str, Tuple[str, str, int]] = {
                    "identity": ("IDENT001", "identidade", -20),
                    "personality": ("PERS001", "personalidade", -19),
                    "phonetic_rules": ("PRON001", "pronuncia", -18),
                    "absolute_rules": ("REGR001", "regras", -17),
                    "natural_expressions": ("EXPR001", "expressoes", -16),
                    "scheduling_rules": ("AGEN001", "agendamento", -15),
                }
                data = payload.model_dump()
                for field_key, (block_key, block_type, order_index) in profile_to_block.items():
                    val = data.get(field_key)
                    if field_key == "scheduling_rules":
                        content_str = json.dumps(val, ensure_ascii=False) if isinstance(val, dict) else "{}"
                    else:
                        content_str = (val or "").strip() if isinstance(val, str) else str(val or "")

                    row = {
                        "flow_id": flow_id,
                        "assistente_id": assistente_id_flow,
                        "tenant_id": tenant_id_flow,
                        "block_key": block_key,
                        "block_type": block_type,
                        "content": content_str,
                        "order_index": order_index,
                    }
                    try:
                        client.table("flow_blocks").upsert(row, on_conflict="flow_id,block_key").execute()
                        logger.info("Profile campo %s salvo em flow_blocks (%s)", field_key, block_key)
                    except Exception as e:
                        logger.warning("Erro ao upsert bloco %s: %s", block_key, e)
        except Exception as flow_err:
            logger.warning("Erro ao salvar profile em flow_blocks (profile salvo em assistant_profiles): %s", flow_err)

        return {"success": True, "profile": saved}
    except Exception as e:
        logger.error("Erro ao salvar assistant_profile: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assistants/{assistant_id}/flow")
async def get_flow(assistant_id: str):
    try:
        flow = supabase_service.get_assistant_flow(assistant_id)
        if not flow:
            return {"success": True, "flow": None}
        return {"success": True, "flow": flow}
    except Exception as e:
        logger.error(f"Erro ao buscar assistant_flow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/assistants/{assistant_id}/flow")
async def upsert_flow(assistant_id: str, payload: AssistantFlowUpsert):
    try:
        saved = supabase_service.upsert_assistant_flow(
            assistant_id,
            payload.flow_json,
            meta={"title": payload.title, "description": payload.description},
        )
        return {"success": True, "flow": saved}
    except Exception as e:
        logger.error(f"Erro ao salvar assistant_flow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assistants/{assistant_id}/prompt-import/parse")
async def prompt_import_parse(assistant_id: str, req: PromptImportParseRequest):
    try:
        parsed = parse_prompt_master(req.prompt_master)
        # optional: store history (best-effort)
        try:
            supabase_service.create_prompt_import_run(
                assistant_id,
                {
                    "input_text": req.prompt_master,
                    "extracted_globals": parsed.get("extracted_globals", {}),
                    "suggested_blocks": parsed.get("suggested_blocks", []),
                },
            )
        except Exception as e:
            logger.info(f"prompt_import_runs not stored (ignored): {e}")
        return {"success": True, **parsed}
    except Exception as e:
        logger.error(f"Erro ao parse prompt_master: {e}")
        raise HTTPException(status_code=500, detail=str(e))

