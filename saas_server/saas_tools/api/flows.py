"""
Flow Editor API: list, get, create, save, update flows; get built prompt.
"""
import httpx
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from pydantic import BaseModel
import logging

from saas_tools.models.schemas import (
    FlowCreate,
    FlowUpdate,
    SaveFlowPayload,
    SaveFlowResult,
    FlowBlockUpsert,
    ConvertToWhatsAppPayload,
)
from saas_tools.services import flow_service
from saas_tools.services import prompt_builder
from saas_tools.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["flows"])


class FlowBlockCreateBetween(BaseModel):
    block_type: str
    content: Optional[str] = ""
    insert_after_key: str
    insert_before_key: str
    tool_type: Optional[str] = None


def _get_first_message(assistente_id: str) -> str:
    """Busca first_message na tabela assistentes. Tenta por assistente_id e por id (UUID). Aceita coluna first_message ou primeira_mensagem."""
    if not assistente_id:
        return ""
    try:
        client = supabase_service._require_client()
        for col in ("assistente_id", "id"):
            try:
                # Buscar ambas as colunas possíveis (alguns schemas usam primeira_mensagem)
                ar = client.table("assistentes").select("first_message, primeira_mensagem").eq(col, assistente_id).limit(1).execute()
                if ar.data and len(ar.data) > 0:
                    row = ar.data[0]
                    msg = row.get("first_message") or row.get("primeira_mensagem")
                    if msg is not None:
                        return msg if isinstance(msg, str) else ""
            except Exception:
                try:
                    ar = client.table("assistentes").select("first_message").eq(col, assistente_id).limit(1).execute()
                    if ar.data and len(ar.data) > 0 and ar.data[0].get("first_message") is not None:
                        return ar.data[0].get("first_message") or ""
                except Exception:
                    continue
    except Exception as e:
        logger.warning("get_first_message: %s", e)
    return ""


def _save_block_routes(client, flow_id: str, block_key: str, routes: list, assistente_id: str, tenant_id: str) -> list:
    """
    Salva/atualiza as routes de um bloco específico.
    
    Estratégia: DELETE todas as routes antigas do bloco, depois INSERT as novas.
    Isso garante que routes removidas do canvas sejam deletadas do banco.
    """
    from saas_tools.models.schemas import FlowRouteUpsert
    
    logger.info("🔵 [API] _save_block_routes: flow_id=%s, block_key=%s, routes=%d", flow_id, block_key, len(routes))
    
    # 1. Buscar o block_id do bloco
    block_resp = client.table("flow_blocks").select("id").eq("flow_id", flow_id).eq("block_key", block_key).limit(1).execute()
    if not block_resp.data:
        logger.error("❌ [API] Bloco %s não encontrado para salvar routes", block_key)
        return []
    
    block_id = block_resp.data[0]["id"]
    logger.info("✅ [API] Block_id encontrado: %s", block_id)
    
    # 2. Deletar todas as routes antigas deste bloco
    try:
        delete_result = client.table("flow_routes").delete().eq("flow_id", flow_id).eq("block_id", block_id).execute()
        logger.info("🗑️ [API] Routes antigas deletadas do bloco %s", block_key)
    except Exception as e:
        logger.warning("⚠️ [API] Erro ao deletar routes antigas (pode não existirem): %s", str(e)[:200])
    
    # 3. Se não há routes novas, apenas retornar (já deletamos as antigas)
    if not routes:
        logger.info("ℹ️ [API] Nenhuma route para inserir (todas foram deletadas)")
        return []
    
    # 4. Preparar e inserir as novas routes
    routes_to_insert = []
    for idx, route in enumerate(routes):
        # Validar que é FlowRouteUpsert
        if isinstance(route, dict):
            route = FlowRouteUpsert(**route)
        elif not isinstance(route, FlowRouteUpsert):
            logger.warning("⚠️ [API] Route inválida no índice %d, pulando...", idx)
            continue
        
        # Garantir que route_key existe
        route_key = route.route_key
        if not route_key or route_key.strip() == "":
            route_key = f"{block_key}_route_{idx + 1}"
            logger.info("⚠️ [API] Route sem route_key, gerando: %s", route_key)
        
        route_row = {
            "flow_id": flow_id,
            "assistente_id": assistente_id,
            "tenant_id": tenant_id,
            "block_id": block_id,
            "route_key": route_key,
            "label": route.label or "",
            "ordem": route.ordem if route.ordem is not None else (idx + 1),
            "cor": route.cor or "#6b7280",
            "keywords": route.keywords or [],
            "response": route.response or "",
            "destination_type": route.destination_type or "continuar",
            "destination_block_key": route.destination_block_key,
            "max_loop_attempts": route.max_loop_attempts if route.max_loop_attempts is not None else 2,
            "is_fallback": route.is_fallback or False,
        }
        routes_to_insert.append(route_row)
        logger.debug("  ✅ Route preparada: route_key=%s, label=%s", route_key, route.label or "")
    
    # 5. Inserir todas as routes de uma vez
    if routes_to_insert:
        try:
            insert_result = client.table("flow_routes").insert(routes_to_insert).execute()
            logger.info("✅ [API] %d routes inseridas com sucesso para bloco %s", len(routes_to_insert), block_key)
            
            # Verificar se realmente foram inseridas
            verify_resp = client.table("flow_routes").select("id, route_key, label").eq("flow_id", flow_id).eq("block_id", block_id).execute()
            logger.info("🔍 [API] Verificação: %d routes encontradas no banco após inserção", len(verify_resp.data or []))
            
            return routes_to_insert
        except Exception as e:
            error_str = str(e)
            logger.error("❌ [API] Erro ao inserir routes: %s", error_str[:500])
            import traceback
            logger.error("Traceback: %s", traceback.format_exc()[:500])
            
            # Tentar inserir uma por uma como fallback
            inserted_count = 0
            for route_row in routes_to_insert:
                try:
                    client.table("flow_routes").insert([route_row]).execute()
                    inserted_count += 1
                    logger.info("✅ [API] Route inserida individualmente: %s", route_row.get("route_key"))
                except Exception as e2:
                    logger.error("❌ [API] Erro ao inserir route %s: %s", route_row.get("route_key"), str(e2)[:300])
            logger.info("✅ [API] %d de %d routes inseridas individualmente", inserted_count, len(routes_to_insert))
            return routes_to_insert[:inserted_count] if inserted_count > 0 else []
    
    return []


@router.get("/flows")
def list_flows(tenant_id: str = Query(..., description="Tenant ID")) -> list:
    """List flows for the given tenant."""
    flows = flow_service.list_flows_by_tenant(tenant_id)
    return flows


@router.get("/flows/by-assistant/{assistente_id}")
def get_flow_by_assistant(
    assistente_id: str,
    tenant_id: str = Query(..., description="Tenant ID (used to create flow if none exists)"),
    create_if_missing: bool = Query(True, description="Create a default flow if none linked"),
) -> dict:
    """Return the flow linked to this assistant."""
    logger.info(f"🌐 [API] get_flow_by_assistant: assistente_id={assistente_id}, tenant_id={tenant_id}, create_if_missing={create_if_missing}")
    try:
        flow = flow_service.get_flow_by_assistant(assistente_id, tenant_id)
    except Exception as e:
        logger.error(f"❌ [API] Erro ao buscar flow por assistente: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        if not create_if_missing:
            raise HTTPException(status_code=500, detail=f"Erro ao buscar flow: {str(e)}")
        flow = None
    
    if flow:
        logger.info(f"✅ [API] Flow encontrado: flow_id={flow.get('id')}")
        try:
            complete = flow_service.get_flow_complete(flow["id"])
        except Exception as e:
            logger.error(f"❌ [API] Erro ao buscar flow completo: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            first_message = _get_first_message(flow.get("assistente_id") or "")
            # Mesmo com erro (ex.: IA não configurada), retornar blocos do banco para o canvas carregar
            try:
                blocks_fallback = flow_service.get_flow_blocks(flow["id"])
                logger.info(f"✅ [API] get_flow_by_assistant: flow_id={flow['id']}, blocos={len(blocks_fallback)} (fallback após erro em get_flow_complete)")
                return {"flow": flow, "blocks": blocks_fallback, "routes": [], "first_message": first_message}
            except Exception as e2:
                logger.warning(f"⚠️ [API] get_flow_blocks também falhou: {e2}")
            return {"flow": flow, "blocks": [], "routes": [], "first_message": first_message}
        if complete:
            # ⭐ NOVO: Routes agora estão em routes_data (JSONB) dentro de flow_blocks
            # Não retornar routes separadas, apenas blocos (que já têm routes_data)
            blocks = complete.get("blocks") or []
            
            # 🔍 DEBUG CRÍTICO: Verificar se routes_data está presente nos blocos ANTES de retornar
            caminhos_blocks = [b for b in blocks if b.get("block_type") == "caminhos"]
            if caminhos_blocks:
                logger.info(f"🔍 [API] Verificando {len(caminhos_blocks)} blocos de caminhos antes de retornar")
                for block in caminhos_blocks:
                    block_key = block.get("block_key", "SEM_KEY")
                    has_routes_data = "routes_data" in block
                    routes_data_value = block.get("routes_data")
                    routes_data_type = type(routes_data_value).__name__ if routes_data_value is not None else "None"
                    routes_data_length = len(routes_data_value) if isinstance(routes_data_value, list) else "N/A"
                    
                    logger.info(f"🔍 [API] Bloco {block_key}:")
                    logger.info(f"  - has_routes_data: {has_routes_data}")
                    logger.info(f"  - routes_data_type: {routes_data_type}")
                    logger.info(f"  - routes_data_length: {routes_data_length}")
                    logger.info(f"  - routes_data_value: {str(routes_data_value)[:200] if routes_data_value else 'None'}")
                    logger.info(f"  - TODAS propriedades: {list(block.keys())}")
                    
                    # ⚠️ VERIFICAÇÃO CRÍTICA: Se CAM001 não tem routes_data, buscar diretamente
                    if block_key == "CAM001" and (not has_routes_data or routes_data_value is None):
                        logger.error(f"❌ [API] CAM001 SEM routes_data! Buscando diretamente do banco...")
                        try:
                            client = supabase_service._require_client()
                            direct_resp = client.table("flow_blocks").select("routes_data").eq("block_key", "CAM001").eq("flow_id", flow["id"]).single().execute()
                            if direct_resp.data and "routes_data" in direct_resp.data:
                                block["routes_data"] = direct_resp.data["routes_data"]
                                logger.info(f"✅ [API] routes_data recuperado para CAM001: {len(block['routes_data'])} routes")
                        except Exception as e:
                            logger.error(f"❌ [API] Erro ao buscar routes_data para CAM001: {str(e)}")
            
            # ⚠️ GARANTIR que routes_data está presente antes de serializar JSON
            for block in blocks:
                if block.get("block_type") == "caminhos" and "routes_data" not in block:
                    logger.warning(f"⚠️ [API] Bloco {block.get('block_key')} não tem routes_data antes de serializar!")
                    block["routes_data"] = []
            
            # Primeira mensagem vem de assistentes.first_message (busca por assistente_id ou id)
            assistente_id_val = (complete.get("flow") or flow).get("assistente_id")
            first_message = _get_first_message(assistente_id_val or "")

            result = {
                "flow": complete.get("flow") or flow,
                "blocks": blocks,  # ⭐ Blocos com routes_data (fluxo: order_index >= -5)
                "routes": [],  # ⚠️ DEPRECATED: routes agora em routes_data dos blocos
                "first_message": first_message,  # ⭐ assistentes.first_message (exibido como primeiro bloco no canvas)
            }
            
            # 🔍 DEBUG FINAL: Verificar CAM001 no resultado final ANTES de serializar
            cam001_in_result = next((b for b in result["blocks"] if b.get("block_key") == "CAM001"), None)
            if cam001_in_result:
                logger.info(f"🔍 [API] CAM001 NO RESULTADO FINAL ANTES DE SERIALIZAR:")
                logger.info(f"  - has_routes_data: {'routes_data' in cam001_in_result}")
                logger.info(f"  - routes_data_type: {type(cam001_in_result.get('routes_data')).__name__}")
                logger.info(f"  - routes_data_length: {len(cam001_in_result.get('routes_data', [])) if isinstance(cam001_in_result.get('routes_data'), list) else 'N/A'}")
                logger.info(f"  - routes_data_value: {str(cam001_in_result.get('routes_data'))[:500]}")
                logger.info(f"  - TODAS propriedades: {list(cam001_in_result.keys())}")
            
            blocks_count = len(result.get('blocks', []))
            flow_id_returned = (result.get("flow") or flow or {}).get("id") or flow.get("id")
            # Contar routes em routes_data para log
            routes_in_data = sum(
                len(b.get("routes_data", [])) 
                for b in result.get("blocks", []) 
                if b.get("block_type") == "caminhos" and b.get("routes_data")
            )
            logger.info(f"✅ [API] get_flow_by_assistant: flow_id={flow_id_returned}, blocos={blocks_count}, routes em routes_data={routes_in_data}")
            
            # ⚠️ VERIFICAÇÃO FINAL: Se CAM001 não tem routes_data no resultado, buscar diretamente
            if cam001_in_result and (not cam001_in_result.get("routes_data") or len(cam001_in_result.get("routes_data", [])) == 0):
                logger.error(f"❌ [API] CAM001 SEM routes_data no resultado final! Buscando diretamente...")
                try:
                    from saas_tools.services.supabase_service import supabase_service
                    client = supabase_service._require_client()
                    direct_resp = client.table("flow_blocks").select("routes_data").eq("block_key", "CAM001").eq("flow_id", flow["id"]).single().execute()
                    if direct_resp.data and "routes_data" in direct_resp.data and direct_resp.data["routes_data"]:
                        cam001_in_result["routes_data"] = direct_resp.data["routes_data"]
                        logger.info(f"✅ [API] routes_data recuperado para CAM001 no resultado final: {len(cam001_in_result['routes_data'])} routes")
                except Exception as e:
                    logger.error(f"❌ [API] Erro ao buscar routes_data para CAM001 no resultado final: {str(e)}")
            
            return result
        # Flow existe mas get_flow_complete falhou; retornar first_message mesmo assim
        first_message = _get_first_message(flow.get("assistente_id") or "")
        return {"flow": flow, "blocks": [], "routes": [], "first_message": first_message}
    if not create_if_missing:
        raise HTTPException(status_code=404, detail="Nenhum flow vinculado a este assistente")
    
    # Buscar prompt_voz do assistente (opcional; falha não bloqueia)
    prompt_base = ""
    try:
        client = supabase_service._require_client()
        for table_name in ["assistentes", "assistents", "assistants"]:
            for col in ("id", "assistente_id"):
                try:
                    resp = client.table(table_name).select("prompt_voz").eq(col, assistente_id).limit(1).execute()
                    if resp.data and len(resp.data) > 0 and resp.data[0].get("prompt_voz"):
                        prompt_base = (resp.data[0].get("prompt_voz") or "")[:50000]
                        break
                except Exception:
                    continue
            if prompt_base:
                break
    except Exception:
        pass
    
    # Um flow por assistente: get_or_create evita criar segundo flow
    new_flow = None
    try:
        logger.info(f"🔵 [API] get_or_create flow: assistente_id={assistente_id}, tenant_id={tenant_id}")
        new_flow = flow_service.get_or_create_flow_for_assistant(
            assistente_id=assistente_id,
            tenant_id=tenant_id,
            name=f"Flow do assistente {assistente_id[:8] if len(assistente_id) >= 8 else assistente_id}",
            prompt_base=prompt_base or None,
        )
    except Exception as e:
        logger.warning("⚠️ [API] get_or_create_flow_for_assistant falhou: %s; tentando buscar flow existente.", e)
        new_flow = flow_service.get_flow_by_assistant(assistente_id)
    if not new_flow:
        new_flow = flow_service.get_flow_by_assistant(assistente_id)
    if not new_flow:
        raise HTTPException(
            status_code=500,
            detail="Não foi possível criar ou encontrar o flow. Verifique SUPABASE_URL/SUPABASE_KEY e a tabela 'flows'."
        )
    
    try:
        complete = flow_service.get_flow_complete(new_flow["id"])
        out = complete or {"flow": new_flow, "blocks": [], "routes": []}
    except Exception as e:
        logger.warning("⚠️ [API] get_flow_complete falhou: %s; retornando flow com blocos vazios.", e)
        out = {"flow": new_flow, "blocks": [], "routes": []}
    
    first_message = _get_first_message(assistente_id)
    if isinstance(out, dict):
        out["first_message"] = first_message
    return out


@router.get("/flows/{flow_id}")
def get_flow_complete(flow_id: str) -> dict:
    """Return flow + blocks + routes for the editor."""
    data = flow_service.get_flow_complete(flow_id)
    if not data:
        raise HTTPException(status_code=404, detail="Flow não encontrado")
    return data


@router.post("/flows")
def create_flow(payload: FlowCreate) -> dict:
    """Create a new flow."""
    flow = flow_service.create_flow(
        tenant_id=payload.tenant_id,
        name=payload.name,
        assistente_id=payload.assistente_id,
        prompt_base=payload.prompt_base,
        description=payload.description,
    )
    if not flow:
        raise HTTPException(status_code=500, detail="Erro ao criar flow")
    return flow


@router.post("/flows/save", response_model=SaveFlowResult)
def save_flow(payload: SaveFlowPayload) -> dict:
    """Save flow blocks and routes (DELETE all + INSERT all), increment version."""
    logger.info("🔵 [API] save_flow chamado - flow_id=%s, blocks=%d, routes=%d", 
               payload.flow_id, len(payload.blocks), len(payload.routes))
    
    # Log detalhado de cada bloco recebido
    if payload.blocks:
        logger.info("🔵 [API] Blocos recebidos do frontend:")
        for idx, block in enumerate(payload.blocks):
            logger.info("  [%d] %s (%s) - content: '%s'", 
                       idx, block.block_key, block.block_type, (block.content or '')[:60])
    else:
        logger.error("🔴 [API] ⚠️ NENHUM BLOCO recebido do frontend! Isso vai deletar todos os blocos!")
    
    # Log detalhado de cada route recebida
    if payload.routes:
        logger.info("🔵 [API] Routes recebidas do frontend:")
        for idx, route in enumerate(payload.routes):
            logger.info("  [%d] block_key=%s, route_key=%s, label='%s', keywords=%s", 
                       idx, route.block_key, route.route_key, route.label or '', route.keywords or [])
    else:
        logger.warning("⚠️ [API] Nenhuma route recebida do frontend")
    
    result = flow_service.save_flow(payload)
    if not result.get("success"):
        err = result.get("error") or ""
        logger.error("❌ [API] save_flow falhou: %s", err)
        raise HTTPException(
            status_code=404 if "não encontrado" in err else 500,
            detail=err or "Erro ao salvar flow",
        )
    logger.info("✅ [API] save_flow concluído - version=%d", result.get("version", 0))
    return result


CONVERTER_WHATSAPP_WEBHOOK_URL = "https://sdr.salesdever.io/webhook/converter-whatsapp"


@router.post("/flows/{flow_id}/convert-to-whatsapp")
def convert_flow_to_whatsapp(flow_id: str, payload: ConvertToWhatsAppPayload) -> dict:
    """
    Converte o fluxo de voz em blocos de WhatsApp: busca blocos voz + config,
    chama o webhook n8n e insere os blocos retornados com canal='whatsapp' no MESMO flow_id.
    Arquitetura: blocos WhatsApp ficam em flow_blocks com canal='whatsapp', mesmo flow.
    A conversão só pode ser feita uma vez; se já existirem blocos WhatsApp neste flow, retorna 409.
    """
    try:
        client = supabase_service._require_client()
        flow_resp = client.table("flows").select("id, assistente_id, tenant_id").eq("id", flow_id).limit(1).execute()
        if not flow_resp.data:
            raise HTTPException(status_code=404, detail="Flow não encontrado")
        flow = flow_resp.data[0]
        assistente_id = flow.get("assistente_id") or payload.assistente_id
        tenant_id = payload.tenant_id or flow.get("tenant_id") or ""

        # Verificação de "já converteu": blocos com canal='whatsapp' no MESMO flow_id
        existing_whats = (
            client.table("flow_blocks")
            .select("id")
            .eq("flow_id", flow_id)
            .eq("canal", "whatsapp")
            .limit(1)
            .execute()
        )
        if existing_whats.data and len(existing_whats.data) > 0:
            raise HTTPException(
                status_code=409,
                detail="Já existem blocos WhatsApp neste fluxo.",
            )

        blocos_voz_resp = (
            client.table("flow_blocks")
            .select("*")
            .eq("flow_id", flow_id)
            .gte("order_index", 0)
            .or_("canal.is.null,canal.eq.voz")
            .order("order_index")
            .execute()
        )
        blocos_voz = list(blocos_voz_resp.data or [])
        config_resp = (
            client.table("flow_blocks")
            .select("*")
            .eq("flow_id", flow_id)
            .lt("order_index", 0)
            .execute()
        )
        config_blocks = list(config_resp.data or [])

        if not blocos_voz:
            raise HTTPException(status_code=400, detail="Nenhum bloco de voz encontrado para converter")

        nome_assistente = "Assistente"
        if assistente_id:
            a_resp = client.table("assistentes").select("name").eq("assistente_id", assistente_id).limit(1).execute()
            if not a_resp.data:
                a_resp = client.table("assistentes").select("name").eq("id", assistente_id).limit(1).execute()
            if a_resp.data and a_resp.data[0].get("name"):
                nome_assistente = a_resp.data[0]["name"]

        with httpx.Client(timeout=120.0) as client_http:
            r = client_http.post(
                CONVERTER_WHATSAPP_WEBHOOK_URL,
                json={
                    "flow_id": flow_id,
                    "assistant_id": assistente_id,
                    "tenant_id": tenant_id,
                    "nome_assistente": nome_assistente,
                    "blocos_voz": blocos_voz,
                    "config_blocks": config_blocks,
                },
            )
            r.raise_for_status()
            result = r.json()

        blocos_whatsapp = result.get("blocos_whatsapp") if isinstance(result, dict) else []
        if not blocos_whatsapp:
            return {"success": False, "blocks_created": 0, "detail": "Webhook não retornou blocos_whatsapp"}

        inserted = 0
        for b in blocos_whatsapp:
            row = {
                "flow_id": flow_id,
                "block_key": b.get("block_key") or f"WA_{b.get('order_index', inserted)}",
                "block_type": b.get("block_type", "mensagem"),
                "content": b.get("content", ""),
                "order_index": int(b.get("order_index", inserted)),
                "canal": "whatsapp",
                "position_x": float(b.get("position_x", 0)),
                "position_y": float(b.get("position_y", 0)),
                "assistente_id": assistente_id,
                "tenant_id": tenant_id or None,
                "variable_name": b.get("variable_name"),
                "analyze_variable": b.get("analyze_variable"),
                "next_block_key": b.get("next_block_key"),
                "routes_data": b.get("routes_data") if b.get("routes_data") else [],
                "end_type": b.get("end_type"),
                "end_metadata": b.get("end_metadata") or {},
                "tool_config": b.get("tool_config") or {},
            }
            row = {k: v for k, v in row.items() if v is not None}
            try:
                client.table("flow_blocks").insert(row).execute()
                inserted += 1
            except Exception as e:
                if "duplicate" in str(e).lower() or "23505" in str(e):
                    upd = {k: v for k, v in row.items() if k not in ("flow_id", "block_key") and v is not None}
                    if upd:
                        client.table("flow_blocks").update(upd).eq("flow_id", flow_id).eq("block_key", row["block_key"]).execute()
                    inserted += 1
                else:
                    raise

        return {
            "success": True,
            "flow_id": flow_id,
            "total_blocos": inserted,
            "canal": "whatsapp",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("convert_flow_to_whatsapp: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/flows/{flow_id}/blocks/{block_key}")
def update_single_block(
    flow_id: str,
    block_key: str,
    block: FlowBlockUpsert,
) -> dict:
    """
    ⚡ MÉTODO SIMPLES: Atualiza apenas um bloco específico na tabela flow_blocks.
    Use este endpoint quando você editar apenas um bloco no Flow Editor.
    """
    logger.info("🔵 [API] update_single_block: flow_id=%s, block_key=%s", flow_id, block_key)
    
    try:
        client = supabase_service._require_client()
        
        # Buscar o flow para pegar assistente_id e tenant_id
        flow_resp = client.table("flows").select("assistente_id, tenant_id").eq("id", flow_id).limit(1).execute()
        if not flow_resp.data:
            raise HTTPException(status_code=404, detail="Flow não encontrado")
        
        flow_data = flow_resp.data[0]
        assistente_id = flow_data.get("assistente_id")
        tenant_id = flow_data.get("tenant_id")
        
        # Preparar dados para UPDATE
        update_data = {
            "block_type": block.block_type,
            "content": block.content or "",
            "order_index": block.order_index or 0,
            "position_x": float(block.position_x) if block.position_x is not None else 0.0,
            "position_y": float(block.position_y) if block.position_y is not None else 0.0,
        }
        
        # Campos opcionais
        if block.variable_name:
            update_data["variable_name"] = block.variable_name
        if block.timeout_seconds is not None:
            update_data["timeout_seconds"] = block.timeout_seconds
        if block.analyze_variable:
            update_data["analyze_variable"] = block.analyze_variable
        if block.tool_type:
            update_data["tool_type"] = block.tool_type
        if block.tool_config:
            update_data["tool_config"] = block.tool_config if isinstance(block.tool_config, dict) else {}
        if block.end_type:
            update_data["end_type"] = block.end_type
        if block.end_metadata:
            update_data["end_metadata"] = block.end_metadata if isinstance(block.end_metadata, dict) else {}
        if block.next_block_key:
            update_data["next_block_key"] = block.next_block_key
        
        # ⭐ NOVO: Processar routes_data (JSONB) se fornecido
        if block.routes_data is not None:
            # Validar que é uma lista
            if isinstance(block.routes_data, list):
                update_data["routes_data"] = block.routes_data
                logger.info("🔵 [API] Bloco %s tem %d routes em routes_data", block_key, len(block.routes_data))
            else:
                logger.warning("⚠️ [API] routes_data não é uma lista, ignorando: %s", type(block.routes_data))
        
        # route_context: vinculação bloco ↔ rota (first/middle/last)
        if block.route_context is not None:
            update_data["route_context"] = block.route_context if isinstance(block.route_context, dict) else None

        # ⚠️ DEPRECATED: Manter compatibilidade com routes antigas (será removido depois)
        if block.routes is not None and block.block_type == "caminhos":
            logger.info("⚠️ [API] Bloco %s usando campo 'routes' (deprecated). Migre para 'routes_data'", block_key)
            # Converter routes antigas para routes_data
            routes_data = []
            for route in block.routes:
                routes_data.append({
                    "route_key": route.route_key or f"{block_key}_route_{len(routes_data) + 1}",
                    "label": route.label or "",
                    "ordem": route.ordem or len(routes_data) + 1,
                    "cor": route.cor or "#6b7280",
                    "keywords": route.keywords or [],
                    "response": route.response or "",
                    "destination_type": route.destination_type or "continuar",
                    "destination_block_key": route.destination_block_key,
                    "max_loop_attempts": route.max_loop_attempts or 2,
                    "is_fallback": route.is_fallback or False
                })
            update_data["routes_data"] = routes_data
            logger.info("🔵 [API] Convertido %d routes antigas para routes_data", len(routes_data))
        
        # Usar função PostgreSQL RPC para UPDATE rápido (evita timeout do PostgREST)
        try:
            logger.info("🔄 [API] Usando função RPC para atualizar bloco %s", block_key)
            
            # ⭐ Se tem routes_data, usar UPDATE direto (RPC pode não ter suporte ainda)
            if "routes_data" in update_data:
                logger.info("🔵 [API] Bloco %s tem routes_data, usando UPDATE direto em vez de RPC", block_key)
                # Verificar se existe
                existing_resp = client.table("flow_blocks").select("id").eq("flow_id", flow_id).eq("block_key", block_key).limit(1).execute()
                if existing_resp.data:
                    # UPDATE com routes_data
                    result_direct = client.table("flow_blocks").update(update_data).eq("flow_id", flow_id).eq("block_key", block_key).execute()
                    if result_direct.data:
                        routes_data_count = len(update_data.get("routes_data", [])) if isinstance(update_data.get("routes_data"), list) else 0
                        return {
                            "success": True,
                            "block_key": block_key,
                            "action": "updated",
                            "data": result_direct.data[0],
                            "routes_saved": routes_data_count,
                            "routes_data_count": routes_data_count
                        }
                else:
                    # INSERT com routes_data
                    insert_data_with_routes = {
                        "flow_id": flow_id,
                        "block_key": block_key,
                        "assistente_id": assistente_id,
                        "tenant_id": tenant_id,
                        **update_data
                    }
                    result_direct = client.table("flow_blocks").insert(insert_data_with_routes).execute()
                    if result_direct.data:
                        routes_data_count = len(update_data.get("routes_data", [])) if isinstance(update_data.get("routes_data"), list) else 0
                        return {
                            "success": True,
                            "block_key": block_key,
                            "action": "inserted",
                            "data": result_direct.data[0],
                            "routes_saved": routes_data_count,
                            "routes_data_count": routes_data_count
                        }
            
            # Se não tem routes_data, usar RPC (mais rápido)
            rpc_params = {
                "p_flow_id": flow_id,
                "p_block_key": block_key,
                "p_block_type": update_data["block_type"],
                "p_content": update_data["content"],
                "p_order_index": update_data["order_index"],
                "p_position_x": update_data["position_x"],
                "p_position_y": update_data["position_y"],
                "p_variable_name": update_data.get("variable_name"),
                "p_timeout_seconds": update_data.get("timeout_seconds"),
                "p_analyze_variable": update_data.get("analyze_variable"),
                "p_tool_type": update_data.get("tool_type"),
                "p_tool_config": update_data.get("tool_config", {}),
                "p_end_type": update_data.get("end_type"),
                "p_end_metadata": update_data.get("end_metadata", {}),
                "p_next_block_key": update_data.get("next_block_key"),
            }
            
            result = client.rpc("update_flow_block_simple", rpc_params).execute()
            
            if result.data and len(result.data) > 0:
                rpc_result = result.data[0]
                action = rpc_result.get("action", "updated")
                logger.info("✅ [API] Bloco %s %s via RPC", block_key, action)
                
                # ⭐ NOVO: Routes agora estão em routes_data (JSONB), não precisa salvar separadamente
                routes_data_count = 0
                if block.block_type == "caminhos":
                    if block.routes_data:
                        routes_data_count = len(block.routes_data) if isinstance(block.routes_data, list) else 0
                        logger.info("🔵 [API] Bloco %s é do tipo 'caminhos' com %d routes em routes_data (JSONB)", block_key, routes_data_count)
                    elif block.routes:
                        # ⚠️ DEPRECATED: Compatibilidade com formato antigo
                        logger.info("⚠️ [API] Bloco %s usando campo 'routes' (deprecated). Migre para 'routes_data'", block_key)
                        routes_data_count = len(block.routes) if isinstance(block.routes, list) else 0
                    else:
                        logger.info("🔵 [API] Bloco %s é do tipo 'caminhos' sem routes_data", block_key)
                
                # Buscar o bloco completo para retornar
                block_resp = client.table("flow_blocks").select("*").eq("flow_id", flow_id).eq("block_key", block_key).single().execute()
                
                return {
                    "success": True,
                    "block_key": block_key,
                    "action": action,
                    "data": block_resp.data if block_resp.data else {},
                    "routes_saved": routes_data_count,  # ⭐ Compatibilidade: agora conta routes_data
                    "routes_data_count": routes_data_count  # ⭐ NOVO: nome mais claro
                }
            else:
                raise HTTPException(status_code=500, detail=f"RPC não retornou dados para bloco {block_key}")
                
        except Exception as rpc_error:
            error_str = str(rpc_error)
            logger.warning("⚠️ [API] Erro ao usar RPC para %s: %s. Tentando método tradicional...", block_key, error_str[:200])
            
            # Fallback: método tradicional (pode dar timeout, mas tenta)
            try:
                # Verificar se existe
                existing_resp = client.table("flow_blocks").select("id").eq("flow_id", flow_id).eq("block_key", block_key).limit(1).execute()
                
                if existing_resp.data:
                    # UPDATE tradicional
                    result = client.table("flow_blocks").update(update_data).eq("flow_id", flow_id).eq("block_key", block_key).execute()
                    if result.data:
                        # ⭐ Routes agora estão em routes_data (JSONB), já foram salvas no UPDATE acima
                        routes_data_count = 0
                        if block.block_type == "caminhos":
                            if block.routes_data:
                                routes_data_count = len(block.routes_data) if isinstance(block.routes_data, list) else 0
                            elif block.routes:
                                routes_data_count = len(block.routes) if isinstance(block.routes, list) else 0
                        return {
                            "success": True, 
                            "block_key": block_key, 
                            "action": "updated", 
                            "data": result.data[0],
                            "routes_saved": routes_data_count,  # ⭐ Compatibilidade
                            "routes_data_count": routes_data_count  # ⭐ NOVO
                        }
                else:
                    # INSERT tradicional
                    insert_data = {
                        "flow_id": flow_id,
                        "block_key": block_key,
                        "assistente_id": assistente_id,
                        "tenant_id": tenant_id,
                        **update_data
                    }
                    result = client.table("flow_blocks").insert(insert_data).execute()
                    if result.data:
                        # ⭐ Routes agora estão em routes_data (JSONB), já foram salvas no INSERT acima
                        routes_data_count = 0
                        if block.block_type == "caminhos":
                            if block.routes_data:
                                routes_data_count = len(block.routes_data) if isinstance(block.routes_data, list) else 0
                            elif block.routes:
                                routes_data_count = len(block.routes) if isinstance(block.routes, list) else 0
                        return {
                            "success": True, 
                            "block_key": block_key, 
                            "action": "inserted", 
                            "data": result.data[0],
                            "routes_saved": routes_data_count,  # ⭐ Compatibilidade
                            "routes_data_count": routes_data_count  # ⭐ NOVO
                        }
                        
                raise HTTPException(status_code=500, detail=f"Não foi possível atualizar bloco {block_key}")
            except Exception as fallback_error:
                logger.error("❌ [API] Erro no fallback também: %s", str(fallback_error))
                raise HTTPException(status_code=500, detail=f"Erro ao atualizar bloco: {str(fallback_error)}")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error("❌ [API] Erro ao atualizar bloco %s: %s", block_key, str(e))
        import traceback
        logger.error("Traceback: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar bloco: {str(e)}")


@router.post("/flows/{flow_id}/blocks/create-between")
def create_block_between(
    flow_id: str,
    payload: FlowBlockCreateBetween,
) -> dict:
    try:
        created = flow_service.create_block_between(
            flow_id=flow_id,
            block_type=payload.block_type,
            content=payload.content or "",
            insert_after_key=payload.insert_after_key,
            insert_before_key=payload.insert_before_key,
            tool_type=payload.tool_type,
        )
        return {"success": True, "data": created}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("create_block_between: %s", e)
        raise HTTPException(status_code=500, detail=f"Erro ao criar bloco: {str(e)}")


@router.patch("/flows/{flow_id}")
def update_flow(flow_id: str, payload: FlowUpdate) -> dict:
    """Update flow metadata (name, description, prompt_base, status, is_active)."""
    flow = flow_service.get_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow não encontrado")
    data = payload.model_dump(exclude_unset=True)
    ok = flow_service.update_flow(flow_id, data)
    if not ok:
        raise HTTPException(status_code=500, detail="Erro ao atualizar flow")
    updated = flow_service.get_flow(flow_id)
    return updated or flow


@router.get("/flows/{flow_id}/prompt")
def get_flow_prompt(flow_id: str) -> dict:
    """Return the built prompt text for this flow."""
    text = prompt_builder.get_prompt_for_flow(flow_id)
    if text is None:
        raise HTTPException(status_code=404, detail="Flow não encontrado")
    return {"prompt": text}


@router.get("/flows/by-assistant/{assistente_id}/prompt")
def get_prompt_by_assistant(assistente_id: str) -> dict:
    """Return the built prompt for the flow linked to this assistant."""
    flow = flow_service.get_flow_by_assistant(assistente_id)
    if not flow:
        raise HTTPException(
            status_code=404,
            detail="Nenhum flow vinculado a este assistente",
        )
    text = prompt_builder.get_prompt_for_flow(flow["id"])
    if text is None:
        raise HTTPException(status_code=404, detail="Flow não encontrado")
    return {"prompt": text, "flow_id": flow["id"]}


@router.post("/flows/by-assistant/{assistente_id}/apply-prompt")
def apply_prompt_by_assistant(assistente_id: str, payload: dict) -> dict:
    """
    Atualiza o prompt completo do flow e gera os blocos a partir do texto.
    Recebe: { "prompt_text": str, "tenant_id": str (opcional) }.
    Atualiza prompt_base, parseia o texto em blocos e salva no flow.
    """
    from saas_tools.services.prompt_parser import parse_prompt_base_to_blocks
    from saas_tools.models.schemas import SaveFlowPayload, FlowBlockUpsert

    prompt_text = (payload.get("prompt_text") or "").strip()
    tenant_id = payload.get("tenant_id")

    if not prompt_text:
        raise HTTPException(status_code=400, detail="prompt_text não pode estar vazio")

    flow = flow_service.get_flow_by_assistant(assistente_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Nenhum flow vinculado a este assistente")

    flow_id = flow["id"]
    try:
        flow_service.update_flow(flow_id, {"prompt_base": prompt_text})
        parsed_blocks, parsed_routes = parse_prompt_base_to_blocks(
            prompt_text, flow_id, assistente_id, tenant_id
        )

        routes_by_block_key: Dict[str, List[Dict[str, Any]]] = {}
        for route in parsed_routes:
            block_key = route.get("block_key")
            if block_key:
                if block_key not in routes_by_block_key:
                    routes_by_block_key[block_key] = []
                routes_by_block_key[block_key].append({
                    "route_key": route.get("route_key", ""),
                    "label": route.get("label", ""),
                    "ordem": route.get("ordem", 0),
                    "cor": route.get("cor", "#6b7280"),
                    "keywords": route.get("keywords", []),
                    "response": route.get("response"),
                    "destination_type": route.get("destination_type", "continuar"),
                    "destination_block_key": route.get("destination_block_key"),
                    "max_loop_attempts": route.get("max_loop_attempts", 2),
                    "is_fallback": route.get("is_fallback", False),
                })

        for block in parsed_blocks:
            block_key = block.get("block_key")
            if block_key in routes_by_block_key:
                block["routes_data"] = routes_by_block_key[block_key]

        blocks_payload = []
        for idx, b in enumerate(parsed_blocks):
            blocks_payload.append(FlowBlockUpsert(
                block_key=b.get("block_key", ""),
                block_type=b.get("block_type", "mensagem"),
                content=b.get("content", ""),
                next_block_key=b.get("next_block_key"),
                order_index=b.get("order_index", idx),
                position_x=float(b.get("position_x", 0)),
                position_y=float(b.get("position_y", idx * 150)),
                variable_name=b.get("variable_name"),
                analyze_variable=b.get("analyze_variable"),
                routes_data=b.get("routes_data"),
                tool_config=b.get("tool_config") or {},
                end_metadata=b.get("end_metadata") or {},
            ))

        save_result = flow_service.save_flow(SaveFlowPayload(flow_id=flow_id, blocks=blocks_payload, routes=[]))
        if not save_result.get("success"):
            raise HTTPException(status_code=500, detail=save_result.get("error", "Erro ao salvar blocos"))

        return {"success": True, "blocks_count": len(blocks_payload), "flow_id": flow_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("❌ [API] apply-prompt: %s", str(e))
        import traceback
        logger.error("Traceback: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erro ao aplicar prompt: {str(e)}")


@router.post("/flows/normalize-caminhos-in-db")
def normalize_caminhos_in_db() -> dict:
    """
    Corrige no banco: blocos multi caminho (block_type='caminhos') não podem ter route_context.
    Limpa route_context em todos os flow_blocks que são caminhos e tinham route_context preenchido.
    Chamar uma vez para normalizar dados antigos.
    """
    try:
        count = flow_service.normalize_caminhos_route_context_in_db()
        return {"success": True, "updated_count": count, "message": f"route_context limpo em {count} blocos (caminhos)."}
    except Exception as e:
        logger.error("❌ [API] normalize-caminhos-in-db: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/flows/{flow_id}/blocks")
def clear_flow_blocks(flow_id: str) -> dict:
    """
    Limpa todos os blocos de um flow (reset visual).
    NÃO deleta o flow nem o prompt_base, apenas os blocos.
    Útil para testar geração automática pela IA.
    """
    logger.info(f"🧹 [API] clear_flow_blocks: flow_id={flow_id}")
    
    try:
        client = supabase_service._require_client()
        
        # Deletar todos os blocos do flow
        delete_result = client.table("flow_blocks").delete().eq("flow_id", flow_id).execute()
        deleted_count = len(delete_result.data) if delete_result.data else 0
        
        logger.info(f"✅ [API] {deleted_count} blocos deletados do flow {flow_id}")
        
        return {
            "success": True,
            "message": f"{deleted_count} blocos removidos. Ao recarregar, a IA gerará novos blocos automaticamente.",
            "deleted_count": deleted_count
        }
    except Exception as e:
        logger.error(f"❌ [API] Erro ao limpar blocos: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao limpar blocos: {e!s}")


@router.post("/flows/parse-prompt")
def parse_prompt(payload: dict) -> dict:
    """
    Parse prompt_base e gera blocos e rotas automaticamente.
    Retorna blocos prontos para inserir no banco.
    """
    from saas_tools.services.prompt_parser import parse_prompt_base_to_blocks
    
    prompt_base = payload.get("prompt_base", "")
    flow_id = payload.get("flow_id", "")
    assistente_id = payload.get("assistente_id")
    tenant_id = payload.get("tenant_id")
    
    if not prompt_base or not prompt_base.strip():
        raise HTTPException(status_code=400, detail="prompt_base não pode estar vazio")
    
    if not flow_id:
        raise HTTPException(status_code=400, detail="flow_id é obrigatório")
    
    try:
        logger.info("🔵 [API] parse-prompt: Parseando prompt de %d caracteres", len(prompt_base))
        parsed_blocks, parsed_routes = parse_prompt_base_to_blocks(
            prompt_base, flow_id, assistente_id, tenant_id
        )
        
        logger.info("✅ [API] parse-prompt: Gerados %d blocos e %d rotas", len(parsed_blocks), len(parsed_routes))
        
        # Converter routes para routes_data nos blocos
        # Agrupar routes por block_key
        routes_by_block_key: Dict[str, List[Dict[str, Any]]] = {}
        for route in parsed_routes:
            block_key = route.get("block_key")
            if block_key:
                if block_key not in routes_by_block_key:
                    routes_by_block_key[block_key] = []
                routes_by_block_key[block_key].append({
                    "route_key": route.get("route_key", ""),
                    "label": route.get("label", ""),
                    "ordem": route.get("ordem", 0),
                    "cor": route.get("cor", "#6b7280"),
                    "keywords": route.get("keywords", []),
                    "response": route.get("response"),
                    "destination_type": route.get("destination_type", "continuar"),
                    "destination_block_key": route.get("destination_block_key"),
                    "max_loop_attempts": route.get("max_loop_attempts", 2),
                    "is_fallback": route.get("is_fallback", False),
                })
        
        # Adicionar routes_data aos blocos
        for block in parsed_blocks:
            block_key = block.get("block_key")
            if block_key in routes_by_block_key:
                block["routes_data"] = routes_by_block_key[block_key]
                logger.info("✅ [API] parse-prompt: Bloco %s tem %d routes em routes_data", 
                          block_key, len(block["routes_data"]))
        
        return {
            "success": True,
            "blocks": parsed_blocks,
            "routes": parsed_routes,  # Manter para compatibilidade
        }
    except Exception as e:
        logger.error("❌ [API] parse-prompt: Erro ao parsear prompt: %s", str(e))
        import traceback
        logger.error("Traceback: %s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erro ao parsear prompt: {str(e)}")


@router.post("/flows/{flow_id}/chat")
def flow_chat(
    flow_id: str,
    payload: dict
) -> dict:
    """
    Chat IA para editar o flow conversacionalmente.
    O usuário conversa com a IA e ela aplica mudanças nos blocos automaticamente.
    """
    from saas_tools.services.flow_chat_ai import process_flow_chat
    
    user_message = payload.get("message", "")
    conversation_history = payload.get("conversation_history", [])
    provider = payload.get("provider", "openai")
    prompt_base = payload.get("prompt_base")  # Prompt base atual
    assistente_id = payload.get("assistente_id")  # ID do assistente
    
    if not user_message or not user_message.strip():
        raise HTTPException(status_code=400, detail="Mensagem não pode estar vazia")
    
    # Buscar blocos atuais do flow
    complete_flow = flow_service.get_flow_complete(flow_id)
    if not complete_flow:
        raise HTTPException(status_code=404, detail="Flow não encontrado")
    
    current_blocks = complete_flow.get("blocks", [])
    flow_data = complete_flow.get("flow", {})
    
    # Se não foi fornecido prompt_base, buscar do flow
    if not prompt_base:
        prompt_base = flow_data.get("prompt_base", "")
    
    try:
        logger.info(f"💬 [API] flow_chat: Processando mensagem do usuário (flow_id={flow_id}, prompt_base_length={len(prompt_base) if prompt_base else 0})")
        
        # Processar mensagem com IA
        result = process_flow_chat(
            user_message=user_message,
            conversation_history=conversation_history,
            current_blocks=current_blocks,
            flow_id=flow_id,
            provider=provider,
            prompt_base=prompt_base
        )
        
        changes = result.get("changes", {})
        
        # Aplicar mudanças automaticamente
        if changes:
            logger.info(f"🔄 [API] flow_chat: Aplicando mudanças (prompt_base={bool(changes.get('prompt_base'))}, blocks={len(changes.get('blocks_to_update', [])) + len(changes.get('blocks_to_create', []))})")
            
            # Atualizar prompt_base se fornecido
            if "prompt_base" in changes and changes["prompt_base"]:
                try:
                    logger.info(f"📝 [API] flow_chat: Atualizando prompt_base do flow")
                    flow_service.update_flow(flow_id, {"prompt_base": changes["prompt_base"]})
                    logger.info(f"✅ [API] flow_chat: Prompt base atualizado")
                except Exception as e:
                    logger.error(f"❌ [API] flow_chat: Erro ao atualizar prompt_base: {e}")
            
            # Atualizar blocos existentes
            blocks_to_update = changes.get("blocks_to_update", [])
            for block_update in blocks_to_update:
                block_key = block_update.get("block_key")
                updates = block_update.get("updates", {})
                
                if block_key and updates:
                    try:
                        # Usar endpoint de atualização de bloco individual
                        from saas_tools.models.schemas import FlowBlockUpsert
                        
                        # Buscar bloco atual para preservar campos não atualizados
                        current_block = next((b for b in current_blocks if b.get("block_key") == block_key), None)
                        if current_block:
                            # Mesclar atualizações com dados atuais
                            merged_updates = {
                                "block_type": current_block.get("block_type"),
                                "content": updates.get("content", current_block.get("content", "")),
                                "order_index": updates.get("order_index", current_block.get("order_index", 0)),
                                "position_x": current_block.get("position_x", 0.0),
                                "position_y": current_block.get("position_y", 0.0),
                                "variable_name": updates.get("variable_name", current_block.get("variable_name")),
                                "next_block_key": updates.get("next_block_key", current_block.get("next_block_key")),
                                "timeout_seconds": updates.get("timeout_seconds", current_block.get("timeout_seconds")),
                                "analyze_variable": updates.get("analyze_variable", current_block.get("analyze_variable")),
                                "tool_type": updates.get("tool_type", current_block.get("tool_type")),
                                "tool_config": updates.get("tool_config", current_block.get("tool_config", {})),
                                "end_type": updates.get("end_type", current_block.get("end_type")),
                                "end_metadata": updates.get("end_metadata", current_block.get("end_metadata", {})),
                            }
                            
                            # Se tem routes_data nas atualizações, incluir
                            if "routes_data" in updates:
                                merged_updates["routes_data"] = updates["routes_data"]
                            elif current_block.get("routes_data"):
                                merged_updates["routes_data"] = current_block["routes_data"]
                            
                            block_upsert = FlowBlockUpsert(**merged_updates)
                            
                            # Atualizar via endpoint existente
                            update_result = update_single_block(flow_id, block_key, block_upsert)
                            logger.info(f"✅ [API] flow_chat: Bloco {block_key} atualizado")
                    except Exception as e:
                        logger.error(f"❌ [API] flow_chat: Erro ao atualizar bloco {block_key}: {e}")
            
            # Criar novos blocos
            blocks_to_create = changes.get("blocks_to_create", [])
            for new_block in blocks_to_create:
                try:
                    # Gerar block_key se não fornecido
                    block_type = new_block.get("block_type", "mensagem")
                    if not new_block.get("block_key"):
                        # Gerar block_key baseado no tipo
                        from saas_tools.services.flow_service import get_flow_blocks
                        existing_blocks = get_flow_blocks(flow_id)
                        existing_keys = [b.get("block_key", "") for b in existing_blocks]
                        
                        prefix_map = {
                            "primeira_mensagem": "PM",
                            "mensagem": "MSG",
                            "aguardar": "AG",
                            "caminhos": "CAM",
                            "encerrar": "ENC",
                            "ferramenta": "TOOL"
                        }
                        prefix = prefix_map.get(block_type, "BLK")
                        
                        # Encontrar próximo número
                        max_num = 0
                        for key in existing_keys:
                            if key.startswith(prefix):
                                try:
                                    num = int(key.replace(prefix, ""))
                                    max_num = max(max_num, num)
                                except:
                                    pass
                        
                        block_key = f"{prefix}{max_num + 1:03d}"
                        new_block["block_key"] = block_key
                    
                    # Criar bloco via save_flow
                    # Preparar payload completo
                    from saas_tools.models.schemas import FlowBlockUpsert
                    
                    # Buscar flow para obter tenant_id e assistente_id
                    flow = flow_service.get_flow(flow_id)
                    if flow:
                        block_upsert = FlowBlockUpsert(
                            block_type=new_block.get("block_type", "mensagem"),
                            content=new_block.get("content", ""),
                            order_index=new_block.get("order_index", 0),
                            position_x=new_block.get("position_x", 0.0),
                            position_y=new_block.get("position_y", 0.0),
                            variable_name=new_block.get("variable_name"),
                            next_block_key=new_block.get("next_block_key"),
                            timeout_seconds=new_block.get("timeout_seconds"),
                            analyze_variable=new_block.get("analyze_variable"),
                            tool_type=new_block.get("tool_type"),
                            tool_config=new_block.get("tool_config", {}),
                            end_type=new_block.get("end_type"),
                            end_metadata=new_block.get("end_metadata", {}),
                            routes_data=new_block.get("routes_data")
                        )
                        
                        # Criar via update_single_block (que faz INSERT se não existir)
                        update_result = update_single_block(flow_id, new_block["block_key"], block_upsert)
                        logger.info(f"✅ [API] flow_chat: Bloco {new_block['block_key']} criado")
                except Exception as e:
                    logger.error(f"❌ [API] flow_chat: Erro ao criar bloco: {e}")
            
            # Deletar blocos
            blocks_to_delete = changes.get("blocks_to_delete", [])
            for block_key in blocks_to_delete:
                try:
                    client = supabase_service._require_client()
                    client.table("flow_blocks").delete().eq("flow_id", flow_id).eq("block_key", block_key).execute()
                    logger.info(f"✅ [API] flow_chat: Bloco {block_key} deletado")
                except Exception as e:
                    logger.error(f"❌ [API] flow_chat: Erro ao deletar bloco {block_key}: {e}")
            
            # Atualizar routes
            routes_to_update = changes.get("routes_to_update", {})
            for block_key, routes_data in routes_to_update.items():
                try:
                    # Atualizar routes_data do bloco
                    current_block = next((b for b in current_blocks if b.get("block_key") == block_key), None)
                    if current_block:
                        from saas_tools.models.schemas import FlowBlockUpsert
                        
                        block_upsert = FlowBlockUpsert(
                            block_type=current_block.get("block_type"),
                            content=current_block.get("content", ""),
                            order_index=current_block.get("order_index", 0),
                            position_x=current_block.get("position_x", 0.0),
                            position_y=current_block.get("position_y", 0.0),
                            variable_name=current_block.get("variable_name"),
                            next_block_key=current_block.get("next_block_key"),
                            routes_data=routes_data.get("routes_data", [])
                        )
                        
                        update_result = update_single_block(flow_id, block_key, block_upsert)
                        logger.info(f"✅ [API] flow_chat: Routes do bloco {block_key} atualizadas")
                except Exception as e:
                    logger.error(f"❌ [API] flow_chat: Erro ao atualizar routes do bloco {block_key}: {e}")
        
        # Buscar flow atualizado
        updated_flow = flow_service.get_flow_complete(flow_id)
        updated_flow_data = updated_flow.get("flow") if updated_flow else flow_data
        
        return {
            "message": result.get("message", "Mudanças aplicadas com sucesso!"),
            "changes_applied": bool(changes),
            "flow": updated_flow_data,
            "blocks": updated_flow.get("blocks", []) if updated_flow else current_blocks
        }
        
    except Exception as e:
        logger.error(f"❌ [API] flow_chat: Erro ao processar chat: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar chat: {str(e)}")
