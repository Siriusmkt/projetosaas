"""
Flow Service: CRUD operations for flows, blocks, and routes.
Includes automatic block generation from prompt_base when flow is empty.
"""
import logging
import re
from typing import Dict, Any, List, Optional

from saas_tools.services.supabase_service import supabase_service
from saas_tools.services.prompt_parser import parse_prompt_base_to_blocks
from saas_tools.services.flow_ai_analyzer import analyze_prompt_with_ai

logger = logging.getLogger(__name__)

_ROUTE_COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#eab308", "#a855f7"]


def _legacy_rotas_to_routes_data(legacy: Dict[str, Any], block_key: str) -> tuple[list, str | None]:
    """
    Converte formato legado:
    {
      "rotas": [{ "id", "nome", "cor", "condicoes": [{tipo, valor}], "entao": {acao, target_block_key} }],
      "senao": {acao, target_block_key},
      "analisa": "variavel"
    }
    para o formato routes_data (lista).
    """
    if not isinstance(legacy, dict):
        return [], None
    rotas = legacy.get("rotas")
    if not isinstance(rotas, list):
        return [], None

    routes_data: list[Dict[str, Any]] = []
    for idx, rota in enumerate(rotas):
        if not isinstance(rota, dict):
            continue
        route_key = rota.get("id") or f"{block_key}_route_{idx + 1}"
        label = rota.get("nome") or rota.get("label") or f"Caminho {idx + 1}"
        cor = rota.get("cor") or "#6b7280"

        keywords: list[str] = []
        for cond in rota.get("condicoes") or []:
            if not isinstance(cond, dict):
                continue
            if cond.get("tipo") == "contem_palavra":
                val = cond.get("valor")
                if isinstance(val, str) and val.strip():
                    keywords.append(val.strip())

        entao = rota.get("entao") or {}
        action = entao.get("acao")
        destination_type = "continuar"
        destination_block_key = None
        if action == "ir_para":
            destination_block_key = entao.get("target_block_key") or entao.get("target") or entao.get("block_key")
        elif action == "encerrar":
            destination_type = "encerrar"
        elif action == "loop":
            destination_type = "loop"

        routes_data.append({
            "route_key": route_key,
            "label": label,
            "ordem": idx + 1,
            "cor": cor,
            "keywords": keywords,
            "response": rota.get("response") or "",
            "destination_type": destination_type,
            "destination_block_key": destination_block_key,
            "max_loop_attempts": 2,
            "is_fallback": False,
        })

    # Fallback (senao)
    senao = legacy.get("senao")
    if isinstance(senao, dict):
        action = senao.get("acao")
        destination_type = "continuar"
        destination_block_key = None
        if action == "ir_para":
            destination_block_key = senao.get("target_block_key") or senao.get("target") or senao.get("block_key")
        elif action == "encerrar":
            destination_type = "encerrar"
        elif action == "loop":
            destination_type = "loop"

        routes_data.append({
            "route_key": f"{block_key}_fallback",
            "label": "Outros",
            "ordem": 999,
            "cor": "#6b7280",
            "keywords": [],
            "response": senao.get("response") or "",
            "destination_type": destination_type,
            "destination_block_key": destination_block_key,
            "max_loop_attempts": 2,
            "is_fallback": True,
        })

    analyze_variable = legacy.get("analisa")
    if not isinstance(analyze_variable, str) or not analyze_variable.strip():
        analyze_variable = None

    return routes_data, analyze_variable


def _normalize_routes_data(block_key: str, routes_data: list) -> list:
    """Garante campos obrigatórios e cores/ordem para routes_data."""
    normalized: list[Dict[str, Any]] = []
    order = 1
    for idx, route in enumerate(routes_data):
        if not isinstance(route, dict):
            continue
        is_fallback = bool(route.get("is_fallback"))
        route_key = route.get("route_key") or (f"{block_key}_fallback" if is_fallback else f"{block_key}_route_{order}")
        label = route.get("label") or ("Outros" if is_fallback else f"Caminho {order}")
        cor = route.get("cor") or _ROUTE_COLORS[(order - 1) % len(_ROUTE_COLORS)]
        keywords = route.get("keywords") if isinstance(route.get("keywords"), list) else []
        response = route.get("response") or ""
        destination_type = route.get("destination_type") or "continuar"
        destination_block_key = route.get("destination_block_key")
        max_loop_attempts = route.get("max_loop_attempts") or 2

        normalized.append({
            "route_key": route_key,
            "label": label,
            "ordem": 999 if is_fallback else order,
            "cor": cor,
            "keywords": keywords,
            "response": response,
            "destination_type": destination_type,
            "destination_block_key": destination_block_key,
            "max_loop_attempts": max_loop_attempts,
            "is_fallback": is_fallback,
        })
        if not is_fallback:
            order += 1
    return normalized


def _ensure_route_targets(flow: Dict[str, Any], blocks: list[Dict[str, Any]]) -> bool:
    """
    Para cada rota com destination_block_key, garante que o bloco existe.
    Se não existir, cria automaticamente (mensagem/encerrar).
    Retorna True se criou algum bloco novo.
    """
    client = supabase_service._require_client()
    existing_keys = {b.get("block_key") for b in blocks if b.get("block_key")}
    max_order = max([b.get("order_index", 0) for b in blocks] or [0])
    created_any = False
    # Index simples por conteúdo para reaproveitar blocos existentes
    content_index: Dict[str, str] = {}
    for b in blocks:
        if b.get("block_type") in ("mensagem", "encerrar"):
            content = b.get("content")
            if isinstance(content, str) and content.strip():
                content_index.setdefault(content.strip(), b.get("block_key"))

    for block in blocks:
        if block.get("block_type") != "caminhos":
            continue
        routes = block.get("routes_data") or []
        routes_updated = False
        for idx, route in enumerate(routes):
            if not isinstance(route, dict):
                continue
            dest_key = route.get("destination_block_key")
            if not dest_key:
                dest_type = route.get("destination_type") or "continuar"
                # Loop sem destino: apontar para o próprio bloco (mantém a visualização do loop)
                if dest_type == "loop":
                    dest_key = block.get("block_key")
                    route["destination_block_key"] = dest_key
                    routes_updated = True
                else:
                    # Tentar reaproveitar bloco existente pelo texto de resposta
                    candidate = (route.get("response") or route.get("label") or "").strip()
                    if candidate and candidate in content_index:
                        dest_key = content_index[candidate]
                        route["destination_block_key"] = dest_key
                        routes_updated = True
                    else:
                        # Criar um novo destino determinístico
                        base_key = block.get("block_key") or "CAM"
                        dest_key = f"{base_key}_dest_{idx + 1}"
                        # Garantir unicidade
                        counter = 1
                        while dest_key in existing_keys:
                            counter += 1
                            dest_key = f"{base_key}_dest_{idx + 1}_{counter}"
                        route["destination_block_key"] = dest_key
                        routes_updated = True

            if not dest_key or dest_key in existing_keys:
                continue

            dest_type = route.get("destination_type") or "continuar"
            block_type = "encerrar" if dest_type == "encerrar" else "mensagem"
            content = route.get("response") or route.get("label") or ("Encerrar conversa" if block_type == "encerrar" else "Mensagem")

            max_order += 1
            new_block = {
                "flow_id": flow.get("id"),
                "assistente_id": flow.get("assistente_id"),
                "tenant_id": flow.get("tenant_id"),
                "block_key": dest_key,
                "block_type": block_type,
                "content": content,
                "order_index": max_order,
                "position_x": 100,
                "position_y": max_order * 150,
                "tool_config": {},
                "end_metadata": {},
            }
            try:
                client.table("flow_blocks").insert([new_block]).execute()
                existing_keys.add(dest_key)
                created_any = True
                logger.info("get_flow_complete: ✅ Bloco criado automaticamente %s (%s)", dest_key, block_type)
            except Exception as e:
                logger.warning("get_flow_complete: ⚠️ Erro ao criar bloco %s: %s", dest_key, str(e)[:200])

        if routes_updated:
            try:
                client.table("flow_blocks").update({"routes_data": routes}).eq("flow_id", flow.get("id")).eq("block_key", block.get("block_key")).execute()
                logger.info("get_flow_complete: ✅ routes_data atualizado com destinos para bloco %s", block.get("block_key"))
            except Exception as e:
                logger.warning("get_flow_complete: ⚠️ Falha ao salvar destinos em routes_data (%s): %s", block.get("block_key"), str(e)[:200])

    return created_any


def get_flow(flow_id: str) -> Optional[Dict[str, Any]]:
    """Get flow by ID."""
    try:
        client = supabase_service._require_client()
        resp = client.table("flows").select("*").eq("id", flow_id).limit(1).execute()
        if resp.data:
            return resp.data[0]
        return None
    except Exception as e:
        logger.error("get_flow: Erro ao buscar flow %s: %s", flow_id, e)
        return None


def get_flow_by_assistant(assistente_id: str, tenant_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Get flow linked to an assistant. If multiple, choose the most complete."""
    try:
        client = supabase_service._require_client()
        def score_flow(flow: Dict[str, Any]) -> int:
            flow_id = flow.get("id")
            if not flow_id:
                return -1
            try:
                blocks_resp = (
                    client.table("flow_blocks")
                    .select("block_type, routes_data, order_index")
                    .eq("flow_id", flow_id)
                    .execute()
                )
                blocks = blocks_resp.data or []
            except Exception:
                blocks = []

            # Blocos de fluxo de conversa (mesmo critério de get_flow_blocks: >= -5 ou null)
            fluxo_blocks = [
                b for b in blocks
                if b.get("order_index") is None or (isinstance(b.get("order_index"), (int, float)) and b.get("order_index") >= -5)
            ]
            num_fluxo_blocks = len(fluxo_blocks)

            caminhos_blocks = [b for b in blocks if b.get("block_type") == "caminhos"]
            total_routes = 0
            routes_with_dest = 0
            for b in caminhos_blocks:
                routes = b.get("routes_data") or []
                if isinstance(routes, list):
                    total_routes += len(routes)
                    for r in routes:
                        if isinstance(r, dict) and r.get("destination_block_key"):
                            routes_with_dest += 1
            # Preferir flow com mais blocos de fluxo (evita pegar um flow "esqueleto" com poucos blocos)
            return (routes_with_dest * 10) + total_routes + (len(caminhos_blocks) * 2) + num_fluxo_blocks

        # 1) Primeiro, tentar flows do tenant
        flows_tenant: list[Dict[str, Any]] = []
        if tenant_id:
            resp = (
                client.table("flows")
                .select("*")
                .eq("assistente_id", assistente_id)
                .eq("tenant_id", tenant_id)
                .order("updated_at", desc=True)
                .execute()
            )
            flows_tenant = resp.data or []

        # 2) Também buscar flows do assistente sem filtrar tenant (fallback)
        resp_all = (
            client.table("flows")
            .select("*")
            .eq("assistente_id", assistente_id)
            .order("updated_at", desc=True)
            .execute()
        )
        flows_all = resp_all.data or []

        if not flows_tenant and not flows_all:
            return None

        def pick_best(flows: list[Dict[str, Any]]) -> tuple[Optional[Dict[str, Any]], int]:
            best = None
            best_score = -1
            for f in flows:
                sc = score_flow(f)
                if sc > best_score:
                    best_score = sc
                    best = f
            return best, best_score

        best_tenant, score_tenant = pick_best(flows_tenant) if flows_tenant else (None, -1)
        best_all, score_all = pick_best(flows_all) if flows_all else (None, -1)

        # Preferir tenant, mas se outro flow estiver muito mais completo, usar o melhor geral
        if best_all and (score_all >= score_tenant + 5):
            return best_all
        if best_tenant:
            return best_tenant
        return best_all
    except Exception as e:
        logger.error("get_flow_by_assistant: Erro ao buscar flow para assistente %s: %s", assistente_id, e)
        return None


def normalize_caminhos_route_context_in_db() -> int:
    """
    Garante que blocos multi caminho (block_type='caminhos') nunca tenham route_context no banco.
    Atualiza flow_blocks set route_context = null onde block_type = 'caminhos' e route_context está preenchido.
    Retorna a quantidade de blocos corrigidos.
    """
    try:
        client = supabase_service._require_client()
        resp = (
            client.table("flow_blocks")
            .select("id, block_key, route_context")
            .eq("block_type", "caminhos")
            .limit(5000)
            .execute()
        )
        rows = resp.data or []
        ids_to_clear = [r["id"] for r in rows if r.get("id") and r.get("route_context") is not None]
        if not ids_to_clear:
            logger.info("normalize_caminhos_route_context_in_db: Nenhum bloco caminhos com route_context encontrado.")
            return 0
        for bid in ids_to_clear:
            client.table("flow_blocks").update({"route_context": None}).eq("id", bid).execute()
        logger.info("normalize_caminhos_route_context_in_db: route_context limpo em %d blocos (block_type=caminhos).", len(ids_to_clear))
        return len(ids_to_clear)
    except Exception as e:
        logger.error("normalize_caminhos_route_context_in_db: Erro: %s", e)
        raise


def get_flow_blocks(flow_id: str) -> List[Dict[str, Any]]:
    """Get blocks for a flow. Returns only FLUXO DE CONVERSA blocks (order_index >= -5).
    Includes: mensagem, aguardar, caminhos, encerrar, ferramenta (order_index -5).
    Excludes: identidade, personalidade, regras, expressoes, contexto_negocio, etc. (order_index < -5).
    Use .gte('order_index', 0) for pure flow without ferramenta.
    """
    try:
        client = supabase_service._require_client()
        # ⭐ Blocos de fluxo de conversa: order_index >= -5 OU order_index IS NULL (evitar perder blocos de mensagem)
        select_cols = "*, routes_data, route_context"
        try:
            resp = (
                client.table("flow_blocks")
                .select(select_cols)
                .eq("flow_id", flow_id)
                .gte("order_index", -5)
                .order("order_index")
                .limit(5000)
                .execute()
            )
            blocks = list(resp.data or [])
            # Incluir também blocos com order_index NULL (ex.: mensagem salva sem índice)
            null_resp = (
                client.table("flow_blocks")
                .select(select_cols)
                .eq("flow_id", flow_id)
                .is_("order_index", "null")
                .limit(5000)
                .execute()
            )
            seen_ids = {b.get("id") for b in blocks}
            for b in (null_resp.data or []):
                if b.get("id") and b.get("id") not in seen_ids:
                    seen_ids.add(b.get("id"))
                    blocks.append(b)
            blocks.sort(key=lambda b: (b.get("order_index") if b.get("order_index") is not None else 999999))
            logger.info("get_flow_blocks: ✅ Query executada, retornados %d blocos (flow_id=%s)", len(blocks), flow_id)
            if blocks:
                type_counts: Dict[str, int] = {}
                for b in blocks:
                    t = b.get("block_type") or "unknown"
                    type_counts[t] = type_counts.get(t, 0) + 1
                logger.info("get_flow_blocks: resumo por block_type: %s", type_counts)
            
            # 🔍 DEBUG: Verificar se routes_data está presente nos blocos retornados
            if blocks:
                sample_block = blocks[0]
                logger.info("get_flow_blocks: 🔍 Exemplo de bloco retornado - propriedades: %s", list(sample_block.keys()))
                if "routes_data" in sample_block:
                    logger.info("get_flow_blocks: ✅ routes_data está presente nos blocos retornados")
                else:
                    logger.warning("get_flow_blocks: ⚠️ routes_data NÃO está presente nos blocos retornados!")
        except Exception as e:
            logger.error("get_flow_blocks: ❌ Erro ao buscar blocos: %s", str(e))
            import traceback
            logger.error("get_flow_blocks: Traceback: %s", traceback.format_exc())
            return []
        
        # 🔍 DEBUG: Log detalhado do que veio do banco ANTES de processar
        logger.info("get_flow_blocks: Retornados %d blocos do banco", len(blocks))
        caminhos_blocks = [b for b in blocks if b.get("block_type") == "caminhos"]
        if caminhos_blocks:
            logger.info("get_flow_blocks: 🔍 Encontrados %d blocos de caminhos", len(caminhos_blocks))
            for block in caminhos_blocks:
                block_key = block.get("block_key", "SEM_KEY")
                has_routes_data = "routes_data" in block
                routes_data_value = block.get("routes_data")
                routes_data_type = type(routes_data_value).__name__ if routes_data_value is not None else "None"
                routes_data_length = len(routes_data_value) if isinstance(routes_data_value, list) else "N/A"
                
                logger.info("get_flow_blocks: 🔍 Bloco %s:", block_key)
                logger.info("  - routes_data presente: %s", has_routes_data)
                logger.info("  - routes_data tipo: %s", routes_data_type)
                logger.info("  - routes_data length: %s", routes_data_length)
                logger.info("  - routes_data valor: %s", str(routes_data_value)[:200] if routes_data_value else "None")
                logger.info("  - TODAS propriedades do bloco: %s", list(block.keys()))

                # 🔄 Suporte a formato legado (rotas/senao/analisa)
                if isinstance(routes_data_value, dict) and "rotas" in routes_data_value:
                    try:
                        normalized_routes, analyze_var = _legacy_rotas_to_routes_data(routes_data_value, block_key)
                        block["routes_data"] = normalized_routes
                        if analyze_var and not block.get("analyze_variable"):
                            block["analyze_variable"] = analyze_var
                        # Persistir normalização no banco para próximas leituras
                        update_payload = {"routes_data": normalized_routes}
                        if analyze_var and not block.get("analyze_variable"):
                            update_payload["analyze_variable"] = analyze_var
                        client.table("flow_blocks").update(update_payload).eq("id", block.get("id")).execute()
                        logger.info("get_flow_blocks: ✅ routes_data normalizado (legado) para bloco %s", block_key)
                    except Exception as e:
                        logger.warning("get_flow_blocks: ⚠️ Falha ao normalizar routes_data legado (%s): %s", block_key, str(e))
                elif isinstance(routes_data_value, list):
                    normalized_routes = _normalize_routes_data(block_key, routes_data_value)
                    if normalized_routes != routes_data_value:
                        block["routes_data"] = normalized_routes
                        try:
                            client.table("flow_blocks").update({"routes_data": normalized_routes}).eq("id", block.get("id")).execute()
                            logger.info("get_flow_blocks: ✅ routes_data normalizado (campos/cor/ordem) para bloco %s", block_key)
                        except Exception as e:
                            logger.warning("get_flow_blocks: ⚠️ Falha ao salvar routes_data normalizado (%s): %s", block_key, str(e))
                
                # Se não tem routes_data mas deveria ter, tentar buscar diretamente
                if not has_routes_data:
                    logger.warning("get_flow_blocks: ⚠️ Bloco %s não tem routes_data! Tentando buscar diretamente...", block_key)
                    try:
                        block_id = block.get("id")
                        if block_id:
                            direct_resp = client.table("flow_blocks").select("routes_data").eq("id", block_id).single().execute()
                            if direct_resp.data and "routes_data" in direct_resp.data:
                                block["routes_data"] = direct_resp.data["routes_data"]
                                logger.info("get_flow_blocks: ✅ routes_data recuperado diretamente para bloco %s: %s", 
                                          block_key, str(block["routes_data"])[:100])
                            else:
                                logger.warning("get_flow_blocks: ⚠️ Busca direta também não retornou routes_data para bloco %s", block_key)
                    except Exception as e2:
                        logger.error("get_flow_blocks: ❌ Erro ao buscar routes_data diretamente: %s", str(e2))
        
        # ⭐ GARANTIR que blocos de caminhos sempre tenham routes_data (mesmo que vazio)
        for block in blocks:
            if block.get("block_type") == "caminhos":
                # Se routes_data não existe ou é None, definir como array vazio
                if "routes_data" not in block or block.get("routes_data") is None:
                    block["routes_data"] = []
                    logger.info("get_flow_blocks: Bloco %s não tinha routes_data, definido como []", block.get("block_key"))
        
        # 🔍 DEBUG: Verificar se routes_data está presente ANTES de retornar
        caminhos_blocks = [b for b in blocks if b.get("block_type") == "caminhos"]
        if caminhos_blocks:
            logger.info("get_flow_blocks: ✅ Encontrados %d blocos de caminhos", len(caminhos_blocks))
            for block in caminhos_blocks:
                block_key = block.get("block_key", "SEM_KEY")
                has_routes_data = "routes_data" in block
                routes_data_value = block.get("routes_data")
                routes_data_type = type(routes_data_value).__name__ if routes_data_value is not None else "None"
                routes_data_count = len(routes_data_value) if isinstance(routes_data_value, list) else 0
                
                logger.info("get_flow_blocks: 🔍 Bloco %s ANTES DE RETORNAR:", block_key)
                logger.info("  - has_routes_data: %s", has_routes_data)
                logger.info("  - routes_data_type: %s", routes_data_type)
                logger.info("  - routes_data_count: %d", routes_data_count)
                logger.info("  - routes_data_value: %s", str(routes_data_value)[:300] if routes_data_value else "None")
                logger.info("  - TODAS propriedades: %s", list(block.keys()))
                
                # ⚠️ VERIFICAÇÃO CRÍTICA: Se routes_data não está presente, tentar buscar novamente
                if not has_routes_data or routes_data_value is None:
                    logger.warning("get_flow_blocks: ⚠️ Bloco %s SEM routes_data antes de retornar! Tentando buscar novamente...", block_key)
                    try:
                        block_id = block.get("id")
                        if block_id:
                            direct_resp = client.table("flow_blocks").select("routes_data").eq("id", block_id).single().execute()
                            if direct_resp.data and "routes_data" in direct_resp.data:
                                block["routes_data"] = direct_resp.data["routes_data"]
                                logger.info("get_flow_blocks: ✅ routes_data recuperado para bloco %s: %d routes", 
                                          block_key, len(block["routes_data"]) if isinstance(block["routes_data"], list) else 0)
                    except Exception as e3:
                        logger.error("get_flow_blocks: ❌ Erro ao buscar routes_data novamente: %s", str(e3))
        
        # 🔍 DEBUG FINAL: Verificar CAM001 especificamente
        cam001_block = next((b for b in blocks if b.get("block_key") == "CAM001"), None)
        if cam001_block:
            logger.info("get_flow_blocks: 🔍 CAM001 FINAL:")
            logger.info("  - has_routes_data: %s", "routes_data" in cam001_block)
            logger.info("  - routes_data: %s", str(cam001_block.get("routes_data"))[:500])
            logger.info("  - routes_data_length: %s", len(cam001_block.get("routes_data", [])) if isinstance(cam001_block.get("routes_data"), list) else "N/A")
        
        return blocks
    except Exception as e:
        logger.error("get_flow_blocks: Erro ao buscar blocos para flow %s: %s", flow_id, e)
        return []


def get_flow_routes(flow_id: str) -> List[Dict[str, Any]]:
    """
    ⚠️ DEPRECATED: Routes agora estão em routes_data (JSONB) dentro de flow_blocks.
    Esta função retorna lista vazia para compatibilidade.
    Use get_flow_blocks() e leia routes_data de cada bloco.
    """
    # Routes agora estão em routes_data dentro de flow_blocks
    # Retornar vazio para não quebrar código que ainda espera routes separadas
    return []


def get_flow_complete(flow_id: str) -> Optional[Dict[str, Any]]:
    """
    Get flow with blocks and routes.
    If flow has no blocks but prompt_base has block structure, automatically generate blocks.
    """
    flow = get_flow(flow_id)
    if not flow:
        return None
    
    blocks = get_flow_blocks(flow_id)
    # ⚠️ DEPRECATED: routes agora estão em routes_data (JSONB) dentro de flow_blocks
    routes = []  # Não buscar mais de flow_routes separada
    
    # ⭐ VERIFICAR SE FALTAM ROUTES_DATA: Se tem blocos de caminhos mas não tem routes_data, gerar do prompt
    caminhos_blocks_without_routes = [b for b in blocks if b.get("block_type") == "caminhos" and (not b.get("routes_data") or len(b.get("routes_data", [])) == 0)]
    if blocks and caminhos_blocks_without_routes:
        # Verificar se há blocos de caminhos sem routes
        caminhos_blocks = [b for b in blocks if b.get("block_type") == "caminhos"]
        if caminhos_blocks:
            logger.info("get_flow_complete: ⚠️ Encontrados %d blocos de caminhos mas nenhuma route. Tentando gerar do prompt...", len(caminhos_blocks))
            assistente_id = flow.get("assistente_id")
            tenant_id = flow.get("tenant_id")
            
            # Buscar prompt_voz do assistente (por assistente_id e por id)
            prompt_to_parse = ""
            if assistente_id:
                try:
                    client = supabase_service._require_client()
                    table_names = ["assistentes", "assistents", "assistants"]
                    for table_name in table_names:
                        for col in ("assistente_id", "id"):
                            try:
                                resp = (
                                    client.table(table_name)
                                    .select("prompt_voz")
                                    .eq(col, assistente_id)
                                    .limit(1)
                                    .execute()
                                )
                                if resp.data and resp.data[0].get("prompt_voz"):
                                    prompt_to_parse = resp.data[0].get("prompt_voz") or ""
                                    break
                            except Exception:
                                continue
                        if prompt_to_parse:
                            break
                except Exception as e:
                    logger.warning("get_flow_complete: Erro ao buscar prompt_voz para gerar routes: %s", e)
            
            # Se não encontrou prompt_voz, usar prompt_base do flow
            if not prompt_to_parse:
                prompt_to_parse = flow.get("prompt_base") or ""
            
            # Parsear apenas as routes do prompt
            if prompt_to_parse:
                try:
                    _, parsed_routes = parse_prompt_base_to_blocks(prompt_to_parse, flow_id, assistente_id, tenant_id)
                    logger.info("get_flow_complete: Parser retornou %d routes para inserir", len(parsed_routes))
                    
                    if parsed_routes:
                        client = supabase_service._require_client()
                        # Criar mapa block_key -> block_id
                        block_key_to_id = {b.get("block_key"): b.get("id") for b in blocks if b.get("block_key") and b.get("id")}
                        
                        routes_to_insert = []
                        for route in parsed_routes:
                            block_key = route.get("block_key")
                            block_id = block_key_to_id.get(block_key)
                            if block_id:
                                route_copy = route.copy()
                                route_copy["block_id"] = block_id
                                if "block_key" in route_copy:
                                    del route_copy["block_key"]
                                routes_to_insert.append(route_copy)
                        
                        # ⭐ NOVO: Inserir routes_data diretamente nos blocos (JSONB)
                        if routes_to_insert:
                            try:
                                # Agrupar routes por block_key
                                routes_by_block_key = {}
                                for route in routes_to_insert:
                                    block_key = route.get("block_key")
                                    if block_key:
                                        if block_key not in routes_by_block_key:
                                            routes_by_block_key[block_key] = []
                                        # Converter para formato routes_data
                                        route_data = {
                                            "route_key": route.get("route_key"),
                                            "label": route.get("label"),
                                            "ordem": route.get("ordem", 999),
                                            "cor": route.get("cor", "#6b7280"),
                                            "keywords": route.get("keywords", []),
                                            "response": route.get("response", ""),
                                            "destination_type": route.get("destination_type", "continuar"),
                                            "destination_block_key": route.get("destination_block_key"),
                                            "max_loop_attempts": route.get("max_loop_attempts", 2),
                                            "is_fallback": route.get("is_fallback", False)
                                        }
                                        routes_by_block_key[block_key].append(route_data)
                                
                                # Atualizar routes_data em cada bloco
                                for block_key, routes_data in routes_by_block_key.items():
                                    client.table("flow_blocks").update({
                                        "routes_data": routes_data
                                    }).eq("flow_id", flow_id).eq("block_key", block_key).execute()
                                
                                logger.info("get_flow_complete: ✅ %d routes inseridas em routes_data para %d blocos", 
                                          len(routes_to_insert), len(routes_by_block_key))
                                # Buscar blocos novamente (agora com routes_data)
                                blocks = get_flow_blocks(flow_id)
                            except Exception as e:
                                logger.error("get_flow_complete: Erro ao inserir routes_data: %s", e)
                except Exception as e:
                    logger.error("get_flow_complete: Erro ao parsear prompt para gerar routes: %s", e)
    
    # ⭐ VERIFICAR SE PRECISA USAR IA PARA ANALISAR PROMPT
    # Usar IA se:
    # 1. Não tem blocos OU
    # 2. Tem blocos mas faltam blocos dentro de rotas OU  
    # 3. Tem blocos de caminhos mas não têm routes_data completo
    assistente_id = flow.get("assistente_id")
    tenant_id = flow.get("tenant_id")
    
    # Buscar prompt_voz do assistente (por assistente_id e por id)
    prompt_to_parse = ""
    if assistente_id:
        try:
            client = supabase_service._require_client()
            table_names = ["assistentes", "assistents", "assistants", "assistente", "assistant"]
            for table_name in table_names:
                for col in ("assistente_id", "id"):
                    try:
                        resp = (
                            client.table(table_name)
                            .select("prompt_voz")
                            .eq(col, assistente_id)
                            .limit(1)
                            .execute()
                        )
                        if resp.data and len(resp.data) > 0 and resp.data[0].get("prompt_voz"):
                            prompt_to_parse = resp.data[0].get("prompt_voz") or ""
                            logger.info(
                                "get_flow_complete: prompt_voz encontrado para %s (tabela: %s, col: %s), length: %d",
                                assistente_id,
                                table_name,
                                col,
                                len(prompt_to_parse),
                            )
                            break
                    except Exception:
                        continue
                if prompt_to_parse:
                    break
        except Exception as e:
            logger.warning("get_flow_complete: Erro ao buscar prompt_voz: %s", e)
    
    # Se não encontrou prompt_voz, usar prompt_base do flow como fallback
    if not prompt_to_parse or not prompt_to_parse.strip():
        prompt_to_parse = flow.get("prompt_base") or ""
        if prompt_to_parse:
            logger.info("get_flow_complete: Usando prompt_base do flow como fallback, length: %d", len(prompt_to_parse))

    # Se ja existem blocos, tentar alinhar routes_data com o prompt (destinos corretos)
    if prompt_to_parse and blocks:
        try:
            _, parsed_routes = parse_prompt_base_to_blocks(prompt_to_parse, flow.get("id"), assistente_id, tenant_id)
            if parsed_routes:
                routes_by_block_key: Dict[str, List[Dict[str, Any]]] = {}
                for route in parsed_routes:
                    block_key = route.get("block_key")
                    if not block_key:
                        continue
                    route_data = {
                        "route_key": route.get("route_key"),
                        "label": route.get("label"),
                        "ordem": route.get("ordem", 999),
                        "cor": route.get("cor", "#6b7280"),
                        "keywords": route.get("keywords", []),
                        "response": route.get("response", ""),
                        "destination_type": route.get("destination_type", "continuar"),
                        "destination_block_key": route.get("destination_block_key"),
                        "max_loop_attempts": route.get("max_loop_attempts", 2),
                        "is_fallback": route.get("is_fallback", False),
                    }
                    routes_by_block_key.setdefault(block_key, []).append(route_data)

                client = supabase_service._require_client()
                updated_blocks = 0
                for block in blocks:
                    if block.get("block_type") != "caminhos":
                        continue
                    block_key = block.get("block_key")
                    parsed_for_block = routes_by_block_key.get(block_key)
                    if not parsed_for_block:
                        continue
                    existing_routes = block.get("routes_data") or []
                    needs_update = False
                    if not existing_routes:
                        needs_update = True
                    else:
                        for r in existing_routes:
                            dest = r.get("destination_block_key")
                            if not dest or (block_key and isinstance(dest, str) and dest.startswith(f"{block_key}_dest_")):
                                needs_update = True
                                break
                    if needs_update:
                        client.table("flow_blocks").update({"routes_data": parsed_for_block}).eq("flow_id", flow.get("id")).eq("block_key", block_key).execute()
                        block["routes_data"] = parsed_for_block
                        updated_blocks += 1

                if updated_blocks:
                    logger.info("get_flow_complete: routes_data alinhado com prompt para %d blocos de caminhos", updated_blocks)
        except Exception as e:
            logger.warning("get_flow_complete: Falha ao alinhar routes_data com prompt: %s", e)

    # Se ainda faltar destino nas rotas, tentar reaproveitar routes_data de outro flow do mesmo assistente
    if assistente_id and blocks:
        try:
            client = supabase_service._require_client()
            updated_blocks = 0
            for block in blocks:
                if block.get("block_type") != "caminhos":
                    continue
                block_key = block.get("block_key")
                routes = block.get("routes_data") or []
                has_missing_dest = False
                if not routes:
                    has_missing_dest = True
                else:
                    for r in routes:
                        if not isinstance(r, dict):
                            continue
                        dest = r.get("destination_block_key")
                        if not dest:
                            has_missing_dest = True
                            break
                        if block_key and isinstance(dest, str):
                            if dest.startswith(f"{block_key}_dest_") or dest == block_key:
                                has_missing_dest = True
                                break
                if not has_missing_dest:
                    continue

                ref_resp = (
                    client.table("flow_blocks")
                    .select("routes_data")
                    .eq("assistente_id", assistente_id)
                    .eq("block_key", block_key)
                    .neq("flow_id", flow.get("id"))
                    .limit(1)
                    .execute()
                )
                if ref_resp.data and ref_resp.data[0].get("routes_data"):
                    ref_routes = ref_resp.data[0].get("routes_data")
                    if isinstance(ref_routes, list) and len(ref_routes) > 0:
                        client.table("flow_blocks").update({"routes_data": ref_routes}).eq("flow_id", flow.get("id")).eq("block_key", block_key).execute()
                        block["routes_data"] = ref_routes
                        updated_blocks += 1

            if updated_blocks:
                logger.info("get_flow_complete: routes_data copiado de outro flow para %d blocos de caminhos", updated_blocks)
        except Exception as e:
            logger.warning("get_flow_complete: Falha ao copiar routes_data de outro flow: %s", e)
    
    # ⭐ SEMPRE USAR IA SE NÃO HÁ BLOCOS (primeira vez)
    # Depois, usar ordem salva do banco
    needs_ai_analysis = False
    if not blocks:
        needs_ai_analysis = True
        logger.info("get_flow_complete: ⚠️ Não há blocos. Usando IA para analisar prompt e gerar blocos automaticamente...")
    else:
        # Blocos dentro de rotas: podem vir com parent_router_id (legado), parentRouterId (front) ou route_context (banco)
        def _has_route_parent(b):
            if b.get("parentRouterId") or b.get("parent_router_id"):
                return True
            rc = b.get("route_context") or {}
            if isinstance(rc, dict) and rc.get("parent_router_block_key"):
                return True
            return False
        blocks_with_parent = [b for b in blocks if _has_route_parent(b)]
        caminhos_blocks = [b for b in blocks if b.get("block_type") == "caminhos"]
        # Se routes_data já tem destination_block_key, o front monta o fluxo sozinho; não chamar IA
        caminhos_com_destino = False
        for c in caminhos_blocks:
            routes_data = c.get("routes_data") or []
            if isinstance(routes_data, list):
                for r in routes_data:
                    if isinstance(r, dict) and r.get("destination_block_key"):
                        caminhos_com_destino = True
                        break
            if caminhos_com_destino:
                break

        # Só pedir IA se realmente faltar estrutura: sem blocos em rota E sem destination_block_key nos caminhos
        if caminhos_blocks and len(blocks_with_parent) == 0 and not caminhos_com_destino:
            if prompt_to_parse and ("Depois:" in prompt_to_parse or "Va para" in prompt_to_parse):
                needs_ai_analysis = True
                logger.info("get_flow_complete: ⚠️ Blocos de caminhos existem mas não há blocos dentro de rotas. Usando IA para analisar...")

        # Verificar se routes_data está completo
        for caminhos_block in caminhos_blocks:
            routes_data = caminhos_block.get("routes_data", [])
            if not routes_data or len(routes_data) == 0:
                needs_ai_analysis = True
                logger.info("get_flow_complete: ⚠️ Bloco %s não tem routes_data completo. Usando IA para analisar...", caminhos_block.get("block_key"))
                break
    
    # ⭐ USAR IA PARA ANALISAR PROMPT E CRIAR/ATUALIZAR BLOCOS
    if needs_ai_analysis and prompt_to_parse and prompt_to_parse.strip():
        try:
            logger.info("get_flow_complete: 🤖 Chamando IA para analisar prompt completo...")
            ai_blocks = analyze_prompt_with_ai(prompt_to_parse, provider="openai")
            
            if ai_blocks and len(ai_blocks) > 0:
                logger.info("get_flow_complete: ✅ IA retornou %d blocos. Criando/atualizando no banco...", len(ai_blocks))
                
                client = supabase_service._require_client()
                
                # Criar mapa de blocos existentes por block_key
                existing_blocks_map = {b.get("block_key"): b for b in blocks if b.get("block_key")}
                
                # Processar blocos da IA
                for ai_block in ai_blocks:
                    block_key = ai_block.get("block_key")
                    if not block_key:
                        logger.warning("get_flow_complete: ⚠️ Bloco da IA sem block_key, pulando...")
                        continue
                    
                    # Preparar dados do bloco
                    # ⚠️ parentRouterId e routeId são apenas para frontend, não salvamos no banco
                    # Blocos dentro de rotas são identificados pela ordem e contexto
                    block_data = {
                        "flow_id": flow_id,
                        "assistente_id": assistente_id,
                        "tenant_id": tenant_id,
                        "block_key": block_key,
                        "block_type": ai_block.get("block_type", "mensagem"),
                        "content": ai_block.get("content", ""),
                        "next_block_key": ai_block.get("next_block_key"),
                        "variable_name": ai_block.get("variable_name"),
                        "analyze_variable": ai_block.get("analyze_variable"),
                        "order_index": ai_block.get("order_index", 0),
                        "position_x": 100,
                        "position_y": ai_block.get("order_index", 0) * 150,
                        "tool_config": {},
                        "end_metadata": {},
                    }
                    
                    # Adicionar routes_data se for bloco de caminhos
                    if ai_block.get("block_type") == "caminhos" and ai_block.get("routes_data"):
                        block_data["routes_data"] = ai_block.get("routes_data")
                    
                    # Remover None values e campos que não existem no banco
                    block_data = {k: v for k, v in block_data.items() if v is not None and k not in ["parentRouterId", "routeId"]}
                    
                    # Verificar se bloco já existe
                    existing_block = existing_blocks_map.get(block_key)
                    
                    if existing_block:
                        # Atualizar bloco existente
                        logger.info("get_flow_complete: 📝 Atualizando bloco existente %s", block_key)
                        client.table("flow_blocks").update(block_data).eq("id", existing_block.get("id")).execute()
                    else:
                        # Criar novo bloco
                        logger.info("get_flow_complete: ➕ Criando novo bloco %s", block_key)
                        client.table("flow_blocks").insert(block_data).execute()
                
                # Buscar blocos atualizados
                blocks = get_flow_blocks(flow_id)
                logger.info("get_flow_complete: ✅ Blocos criados/atualizados pela IA. Total: %d", len(blocks))
                
        except Exception as e:
            logger.error("get_flow_complete: ❌ Erro ao usar IA para analisar prompt: %s", e)
            import traceback
            logger.error("Traceback: %s", traceback.format_exc())
            # Continuar com parser normal como fallback
    
    # ⭐ FALLBACK: Parser normal se não usou IA ou IA falhou
    if not blocks and prompt_to_parse:
        # Verificar se prompt tem estrutura de blocos
        has_block_structure = bool(
            re.search(r'\[(PM|AG|CAM|MSG|ENC|FER)\d+\]', prompt_to_parse, re.IGNORECASE) or
            re.search(r'(PM|AG|CAM|MSG|ENC|FER)\d+', prompt_to_parse, re.IGNORECASE)
        )
        
        logger.info("get_flow_complete: Flow %s - prompt_to_parse length: %d, has_block_structure: %s", 
                   flow_id, len(prompt_to_parse), has_block_structure)
        
        if has_block_structure:
            logger.info("get_flow_complete: Flow %s não tem blocos mas prompt tem estrutura. Gerando blocos automaticamente...", flow_id)
            logger.info("get_flow_complete: Preview do prompt: %s", prompt_to_parse[:200] + "..." if len(prompt_to_parse) > 200 else prompt_to_parse)
            
            try:
                # Parse do prompt para gerar blocos e rotas
                logger.info("get_flow_complete: Chamando parse_prompt_base_to_blocks com prompt de %d caracteres", len(prompt_to_parse))
                parsed_blocks, parsed_routes = parse_prompt_base_to_blocks(
                    prompt_to_parse, flow_id, assistente_id, tenant_id
                )
                
                logger.info("get_flow_complete: Parser retornou %d blocos e %d rotas", len(parsed_blocks), len(parsed_routes))
                
                if parsed_blocks:
                    client = supabase_service._require_client()
                    
                    # ⚠️ NOTA: Se der timeout, desabilite o trigger manualmente:
                    # ALTER TABLE flow_blocks DISABLE TRIGGER trigger_sync_prompt_voz_on_block_change;
                    logger.info("get_flow_complete: ⚠️ Se der timeout, execute no Supabase: ALTER TABLE flow_blocks DISABLE TRIGGER trigger_sync_prompt_voz_on_block_change;")
                    
                    # Inserir blocos em lotes menores para evitar timeout
                    logger.info("get_flow_complete: Inserindo %d blocos em lotes de 3...", len(parsed_blocks))
                    block_key_to_id = {}
                    
                    # Simplificar blocos antes de inserir (remover campos que podem causar problema)
                    simplified_blocks = []
                    for block in parsed_blocks:
                        simplified = {
                            "flow_id": block.get("flow_id"),
                            "assistente_id": block.get("assistente_id"),
                            "tenant_id": block.get("tenant_id"),
                            "block_key": block.get("block_key"),
                            "block_type": block.get("block_type"),
                            "content": block.get("content", ""),
                            "next_block_key": block.get("next_block_key"),
                            "variable_name": block.get("variable_name"),
                            "analyze_variable": block.get("analyze_variable"),
                            "order_index": block.get("order_index", 0),
                            "position_x": block.get("position_x", 100),
                            "position_y": block.get("position_y", 0),
                            "tool_config": block.get("tool_config") or {},
                            "end_metadata": block.get("end_metadata") or {},
                        }
                        # Remover None values
                        simplified = {k: v for k, v in simplified.items() if v is not None}
                        simplified_blocks.append(simplified)
                    
                    # Inserir em lotes de 3 (menor para evitar timeout)
                    batch_size = 3
                    for i in range(0, len(simplified_blocks), batch_size):
                        batch = simplified_blocks[i:i + batch_size]
                        try:
                            result = client.table("flow_blocks").insert(batch).execute()
                            logger.info("get_flow_complete: ✅ Lote %d-%d inserido (%d blocos)", i+1, min(i+batch_size, len(simplified_blocks)), len(batch))
                        except Exception as e:
                            logger.error("get_flow_complete: Erro ao inserir lote %d-%d: %s", i+1, min(i+batch_size, len(simplified_blocks)), str(e)[:200])
                            # Tentar inserir um por um neste lote
                            for single_block in batch:
                                try:
                                    client.table("flow_blocks").insert([single_block]).execute()
                                    logger.info("get_flow_complete: ✅ Bloco %s inserido individualmente", single_block.get("block_key"))
                                except Exception as e2:
                                    logger.error("get_flow_complete: ❌ Erro ao inserir bloco %s: %s", single_block.get("block_key"), str(e2)[:200])
                            continue
                    
                    # Buscar blocos inseridos para mapear block_key -> id
                    try:
                        resp = client.table("flow_blocks").select("id, block_key").eq("flow_id", flow_id).execute()
                        block_key_to_id = {row["block_key"]: row["id"] for row in (resp.data or [])}
                        logger.info("get_flow_complete: ✅ %d blocos mapeados com sucesso", len(block_key_to_id))
                    except Exception as e:
                        logger.error("get_flow_complete: Erro ao buscar blocos inseridos: %s", e)
                        block_key_to_id = {}
                    
                    # Atualizar rotas com block_id correto e inserir
                    if parsed_routes:
                        routes_to_insert = []
                        for route in parsed_routes:
                            block_id = block_key_to_id.get(route.get("block_key"))
                            if block_id:
                                route_copy = route.copy()
                                route_copy["block_id"] = block_id
                                if "block_key" in route_copy:
                                    del route_copy["block_key"]
                                routes_to_insert.append(route_copy)
                        
                        # ⭐ NOVO: Inserir routes_data diretamente nos blocos (JSONB)
                        if routes_to_insert:
                            # Agrupar routes por block_key e atualizar routes_data
                            routes_by_block_key = {}
                            for route in routes_to_insert:
                                block_key = route.get("block_key")
                                if block_key:
                                    if block_key not in routes_by_block_key:
                                        routes_by_block_key[block_key] = []
                                    route_data = {
                                        "route_key": route.get("route_key"),
                                        "label": route.get("label"),
                                        "ordem": route.get("ordem", 999),
                                        "cor": route.get("cor", "#6b7280"),
                                        "keywords": route.get("keywords", []),
                                        "response": route.get("response", ""),
                                        "destination_type": route.get("destination_type", "continuar"),
                                        "destination_block_key": route.get("destination_block_key"),
                                        "max_loop_attempts": route.get("max_loop_attempts", 2),
                                        "is_fallback": route.get("is_fallback", False)
                                    }
                                    routes_by_block_key[block_key].append(route_data)
                            
                            for block_key, routes_data in routes_by_block_key.items():
                                client.table("flow_blocks").update({
                                    "routes_data": routes_data
                                }).eq("flow_id", flow_id).eq("block_key", block_key).execute()
                    
                    # Buscar novamente após inserir (mesmo se alguns lotes falharam)
                    blocks = get_flow_blocks(flow_id)
                    routes = []  # ⚠️ DEPRECATED: routes agora em routes_data
                    
                    if blocks:
                        logger.info("✅ get_flow_complete: Gerados %d blocos e %d rotas automaticamente", len(blocks), len(routes))
                    else:
                        logger.warning("⚠️ get_flow_complete: Nenhum bloco foi inserido (pode ter dado timeout). Tentando inserir novamente em lotes menores...")
                        # Tentar inserir um bloco por vez como último recurso
                        for block in parsed_blocks[:3]:  # Apenas os primeiros 3 para não travar
                            try:
                                client.table("flow_blocks").insert([block]).execute()
                                logger.info("get_flow_complete: ✅ Bloco %s inserido individualmente", block.get("block_key"))
                            except Exception as e:
                                logger.error("get_flow_complete: Erro ao inserir bloco %s: %s", block.get("block_key"), e)
                        
                        # Buscar novamente
                        blocks = get_flow_blocks(flow_id)
                        routes = get_flow_routes(flow_id)
                        if blocks:
                            logger.info("✅ get_flow_complete: %d blocos inseridos após retry", len(blocks))
            except Exception as e:
                logger.error("get_flow_complete: Erro ao gerar blocos automaticamente: %s", e)
                import traceback
                logger.debug("Traceback: %s", traceback.format_exc())
                # Buscar blocos mesmo se deu erro (pode ter inserido alguns)
                blocks = get_flow_blocks(flow_id)
                routes = []  # ⚠️ DEPRECATED: routes agora em routes_data
                if blocks:
                    logger.info("get_flow_complete: Encontrados %d blocos após erro (alguns podem ter sido inseridos)", len(blocks))
        elif prompt_to_parse and not has_block_structure:
            logger.warning("get_flow_complete: Flow %s tem prompt (%d chars) mas NÃO tem estrutura de blocos detectada. Regex: %s", 
                          flow_id, len(prompt_to_parse), r'\[(PM|AG|CAM|MSG|ENC|FER)\d+\]')
            # Tentar buscar blocos de outras formas (ex: ### ENCERRAR [ENC001])
            alt_pattern = re.search(r'(PM\d+|AG\d+|CAM\d+|MSG\d+|ENC\d+|FER\d+)', prompt_to_parse)
            if alt_pattern:
                logger.info("get_flow_complete: Encontrado padrão alternativo: %s", alt_pattern.group())
        elif not prompt_to_parse:
            logger.warning("get_flow_complete: Flow %s não tem prompt_base nem prompt_voz para gerar blocos", flow_id)

    # ⭐ GARANTIR QUE DESTINOS DAS ROTAS EXISTEM COMO BLOCOS
    try:
        if blocks:
            created_any = _ensure_route_targets(flow, blocks)
            if created_any:
                blocks = get_flow_blocks(flow_id)
    except Exception as e:
        logger.warning("get_flow_complete: ⚠️ Falha ao garantir destinos das rotas: %s", str(e))
    
    # ⭐ NOVO: Routes agora estão em routes_data (JSONB) dentro de flow_blocks
    return {
        "flow": flow,
        "blocks": blocks,  # Já contém routes_data para blocos de caminhos
        "routes": [],  # ⚠️ DEPRECATED: routes agora em routes_data dos blocos
    }


def list_flows_by_tenant(tenant_id: str) -> List[Dict[str, Any]]:
    """List all flows for a tenant."""
    try:
        client = supabase_service._require_client()
        resp = (
            client.table("flows")
            .select("*")
            .eq("tenant_id", tenant_id)
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data or []
    except Exception as e:
        logger.error("list_flows_by_tenant: Erro ao listar flows para tenant %s: %s", tenant_id, e)
        return []


def get_or_create_flow_for_assistant(
    assistente_id: str,
    tenant_id: str,
    name: Optional[str] = None,
    prompt_base: Optional[str] = None,
    description: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Um flow por assistente: retorna o flow existente para este assistente_id (e tenant_id)
    ou cria um novo apenas se não existir. Evita múltiplos flows para o mesmo assistente.
    """
    # 1) Buscar flow existente (com tenant quando possível)
    flow = get_flow_by_assistant(assistente_id, tenant_id)
    if flow:
        logger.info("get_or_create_flow_for_assistant: ✅ Reutilizando flow existente: %s", flow.get("id"))
        if name or prompt_base is not None or description is not None:
            try:
                client = supabase_service._require_client()
                update_data = {}
                if name:
                    update_data["name"] = name
                if prompt_base is not None:
                    update_data["prompt_base"] = prompt_base
                if description is not None:
                    update_data["description"] = description
                if update_data:
                    client.table("flows").update(update_data).eq("id", flow["id"]).execute()
            except Exception as e:
                logger.warning("get_or_create_flow_for_assistant: Falha ao atualizar flow: %s", e)
        return flow
    # 2) Nenhum flow existe → criar um
    return create_flow(
        tenant_id=tenant_id,
        name=name or f"Flow do assistente {assistente_id[:8] if len(assistente_id) >= 8 else assistente_id}",
        assistente_id=assistente_id,
        prompt_base=prompt_base,
        description=description,
    )


def create_flow(
    tenant_id: str,
    name: str,
    assistente_id: Optional[str] = None,
    prompt_base: Optional[str] = None,
    description: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Cria um novo flow. Se assistente_id for informado e já existir um flow para esse
    assistente (e tenant), retorna o existente em vez de criar outro (um flow por assistente).
    """
    try:
        client = supabase_service._require_client()
        # Um flow por assistente: evitar criar duplicata
        if assistente_id:
            existing = get_flow_by_assistant(assistente_id, tenant_id)
            if existing:
                logger.info("create_flow: Assistente já tem flow %s; retornando existente.", existing.get("id"))
                return existing

        data = {
            "tenant_id": tenant_id,
            "name": name,
            "prompt_base": prompt_base or "",
            "description": description,
            "version": 1,
        }
        if assistente_id:
            data["assistente_id"] = assistente_id

        logger.info("create_flow: Criando flow com dados: %s", {k: v for k, v in data.items() if k != "prompt_base"})

        resp = client.table("flows").insert(data).execute()

        if resp.data and len(resp.data) > 0:
            logger.info("create_flow: ✅ Flow criado com sucesso: %s", resp.data[0].get("id"))
            return resp.data[0]
        if assistente_id:
            import time
            time.sleep(0.2)
            flow = get_flow_by_assistant(assistente_id)
            if flow:
                logger.info("create_flow: ✅ Flow encontrado após insert: %s", flow.get("id"))
                return flow
        logger.warning("create_flow: Insert não retornou dados e get_flow_by_assistant não encontrou flow.")
        return None
    except Exception as e:
        logger.error("create_flow: Erro ao criar flow: %s", e)
        import traceback
        logger.error("create_flow: Traceback: %s", traceback.format_exc())
        raise


def _next_block_key(flow_id: str, block_type: str) -> str:
    return _next_n_block_keys(flow_id, block_type, 1)[0]


def _next_n_block_keys(flow_id: str, block_type: str, n: int) -> list:
    """Retorna os próximos n block_keys para o tipo (ex: ['MSG001','MSG002','MSG003'])."""
    prefix_map = {
        "primeira_mensagem": "PM",
        "mensagem": "MSG",
        "aguardar": "AG",
        "caminhos": "CAM",
        "encerrar": "ENC",
        "ferramenta": "TOOL",
    }
    prefix = prefix_map.get(block_type, "BLK")
    client = supabase_service._require_client()
    resp = (
        client.table("flow_blocks")
        .select("block_key")
        .eq("flow_id", flow_id)
        .execute()
    )
    keys = [b.get("block_key") or "" for b in (resp.data or [])]
    max_num = 0
    for key in keys:
        if not key.startswith(prefix):
            continue
        try:
            num = int("".join(ch for ch in key if ch.isdigit()) or 0)
            max_num = max(max_num, num)
        except Exception:
            continue
    return [f"{prefix}{str(max_num + i).zfill(3)}" for i in range(1, n + 1)]


def create_block_between(
    flow_id: str,
    block_type: str,
    content: str,
    insert_after_key: str,
    insert_before_key: str,
    tool_type: Optional[str] = None,
) -> Dict[str, Any]:
    client = supabase_service._require_client()
    flow = get_flow(flow_id)
    if not flow:
        raise ValueError("Flow não encontrado")

    after_resp = (
        client.table("flow_blocks")
        .select("order_index")
        .eq("flow_id", flow_id)
        .eq("block_key", insert_after_key)
        .limit(1)
        .execute()
    )
    before_resp = (
        client.table("flow_blocks")
        .select("order_index")
        .eq("flow_id", flow_id)
        .eq("block_key", insert_before_key)
        .limit(1)
        .execute()
    )

    if not after_resp.data or not before_resp.data:
        raise ValueError("Blocos de referência não encontrados")

    after_index = after_resp.data[0].get("order_index", 0)
    before_index = before_resp.data[0].get("order_index", after_index + 10)

    if before_index <= after_index:
        raise ValueError("Ordem inválida: o bloco 'antes de' deve vir depois do 'depois de'")

    # Para bloco de caminhos precisamos de 4 slots (1 router + 3 blocos de rota)
    slots_needed = 4 if block_type == "caminhos" else 1
    if (before_index - after_index) < slots_needed:
        reindex_resp = (
            client.table("flow_blocks")
            .select("id, order_index")
            .eq("flow_id", flow_id)
            .gte("order_index", before_index)
            .order("order_index")
            .execute()
        )
        shift = max(5, slots_needed + 1)
        for b in reindex_resp.data or []:
            new_idx = (b.get("order_index") or 0) + shift
            client.table("flow_blocks").update({"order_index": new_idx}).eq("id", b.get("id")).execute()
        before_index += shift

    order_index = int((after_index + before_index) / 2)
    block_key = _next_block_key(flow_id, block_type)

    if block_type == "caminhos":
        # Criar bloco de caminhos já com rotas e blocos das rotas (mapeamento rota ↔ bloco)
        router_key = _next_block_key(flow_id, "caminhos")
        msg_keys = _next_n_block_keys(flow_id, "mensagem", 3)
        route_1_key = f"{router_key}_route_1"
        route_2_key = f"{router_key}_route_2"
        fallback_key = f"{router_key}_fallback"
        routes_data = [
            {
                "route_key": route_1_key,
                "label": "Sim",
                "ordem": 1,
                "cor": _ROUTE_COLORS[0],
                "keywords": ["sim", "pode", "claro", "quero"],
                "response": "Ótimo! Vamos continuar...",
                "destination_type": "continuar",
                "destination_block_key": msg_keys[0],
                "max_loop_attempts": 2,
                "is_fallback": False,
            },
            {
                "route_key": route_2_key,
                "label": "Não",
                "ordem": 2,
                "cor": _ROUTE_COLORS[1],
                "keywords": ["não", "agora não", "depois"],
                "response": "Entendi! Sem problemas.",
                "destination_type": "continuar",
                "destination_block_key": msg_keys[1],
                "max_loop_attempts": 2,
                "is_fallback": False,
            },
            {
                "route_key": fallback_key,
                "label": "Outros",
                "ordem": 999,
                "cor": "#6b7280",
                "keywords": [],
                "response": "Pode repetir? Não entendi.",
                "destination_type": "loop",
                "destination_block_key": msg_keys[2],
                "max_loop_attempts": 2,
                "is_fallback": True,
            },
        ]
        router_data = {
            "flow_id": flow_id,
            "assistente_id": flow.get("assistente_id"),
            "tenant_id": flow.get("tenant_id"),
            "block_key": router_key,
            "block_type": "caminhos",
            "content": content or "Como o lead respondeu?",
            "order_index": order_index,
            "routes_data": routes_data,
        }
        router_result = client.table("flow_blocks").insert(router_data).execute()
        if not router_result.data:
            raise ValueError("Falha ao criar bloco de caminhos")
        router_row = router_result.data[0]

        route_contents = [
            "Ótimo! Em que mais posso ajudar?",
            "Sem problemas. Posso ajudar em algo mais?",
            "Não entendi. Pode repetir?",
        ]
        for i, (msg_key, rkey, pos) in enumerate([
            (msg_keys[0], route_1_key, "first"),
            (msg_keys[1], route_2_key, "first"),
            (msg_keys[2], fallback_key, "first"),
        ]):
            client.table("flow_blocks").insert({
                "flow_id": flow_id,
                "assistente_id": flow.get("assistente_id"),
                "tenant_id": flow.get("tenant_id"),
                "block_key": msg_key,
                "block_type": "mensagem",
                "content": route_contents[i],
                "order_index": order_index + 1 + i,
                "route_context": {
                    "parent_router_block_key": router_key,
                    "route_key": rkey,
                    "route_position": pos,
                },
            }).execute()

        return router_row

    insert_data = {
        "flow_id": flow_id,
        "assistente_id": flow.get("assistente_id"),
        "tenant_id": flow.get("tenant_id"),
        "block_key": block_key,
        "block_type": block_type,
        "content": content or "",
        "order_index": order_index,
    }
    if tool_type:
        insert_data["tool_type"] = tool_type

    result = client.table("flow_blocks").insert(insert_data).execute()
    if not result.data:
        raise ValueError("Falha ao criar bloco")
    return result.data[0]


def _grazi_order_index(blocos: List[Dict[str, Any]], inserir_depois_de: str) -> int:
    """Calcula order_index para inserir um bloco depois de inserir_depois_de (compatível com a Edge Grazi)."""
    if not blocos:
        return 10
    blocos_sorted = sorted(blocos, key=lambda b: (b.get("order_index") or 0))
    idx_anterior = next((i for i, b in enumerate(blocos_sorted) if b.get("block_key") == inserir_depois_de), -1)
    if idx_anterior == -1:
        return (max((b.get("order_index") or 0) for b in blocos) or 0) + 5
    order_anterior = blocos_sorted[idx_anterior].get("order_index") or 0
    if idx_anterior == len(blocos_sorted) - 1:
        return order_anterior + 5
    order_proximo = blocos_sorted[idx_anterior + 1].get("order_index") or order_anterior + 10
    return int((order_anterior + order_proximo) / 2)


def _get_route_last_block_key(
    client: Any,
    flow_id: str,
    parent_router_block_key: str,
    route_key: str,
) -> Optional[str]:
    """
    Retorna o block_key do último bloco DEDICADO da rota.
    v1.7.3: Só considera blocos com route_context desta rota.
    Retorna None se a rota não tem blocos dedicados.
    """
    router_resp = (
        client.table("flow_blocks")
        .select("routes_data")
        .eq("flow_id", flow_id)
        .eq("block_key", parent_router_block_key)
        .eq("block_type", "caminhos")
        .limit(1)
        .execute()
    )
    if not router_resp.data or not router_resp.data[0].get("routes_data"):
        return None
    routes_data = router_resp.data[0]["routes_data"]
    if not isinstance(routes_data, list):
        return None
    route_entry = next(
        (r for r in routes_data if isinstance(r, dict) and r.get("route_key") == route_key),
        None,
    )
    if not route_entry:
        return None

    # Se tem last_block_key registrado, verificar se ainda existe
    if route_entry.get("last_block_key"):
        check = (
            client.table("flow_blocks")
            .select("block_key")
            .eq("flow_id", flow_id)
            .eq("block_key", route_entry["last_block_key"])
            .limit(1)
            .execute()
        )
        if check.data:
            return route_entry["last_block_key"]

    # Buscar blocos com route_context pra essa rota específica
    all_blocks_resp = (
        client.table("flow_blocks")
        .select("block_key, next_block_key, route_context")
        .eq("flow_id", flow_id)
        .execute()
    )
    route_blocks = []
    for b in (all_blocks_resp.data or []):
        rc = b.get("route_context")
        if not rc or not isinstance(rc, dict):
            continue
        if (
            rc.get("parent_router_block_key") == parent_router_block_key
            and rc.get("route_key") == route_key
        ):
            route_blocks.append(b)

    if not route_blocks:
        return None  # Rota sem blocos dedicados

    # Encontrar o último da cadeia
    by_key = {b["block_key"]: b for b in route_blocks}
    for b in route_blocks:
        nk = b.get("next_block_key")
        if not nk or nk not in by_key:
            return b["block_key"]

    return route_blocks[-1]["block_key"]


def apply_grazi_actions(
    assistente_id: str,
    tenant_id: Optional[str],
    acoes_para_executar: List[Dict[str, Any]],
    flow_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Aplica as ações da Grazi (create/update blocos) no banco.
    v1.7.3: Aceita flow_id, insert_data completo, fix rota sem blocos.
    """
    if not acoes_para_executar:
        return []
    logger.info(
        "apply_grazi_actions: aplicando %d ação(ões) para assistente_id=%s",
        len(acoes_para_executar),
        assistente_id,
    )

    # Buscar flow: primeiro por flow_id (se veio), senão por assistente
    flow = None
    if flow_id:
        flow = get_flow(flow_id)
    if not flow:
        flow = get_flow_by_assistant(assistente_id, tenant_id)
    if not flow:
        return [
            {"acao": a.get("acao"), "block_key": a.get("block_key"), "success": False, "error": "Flow não encontrado"}
            for a in acoes_para_executar
        ]

    client = supabase_service._require_client()
    flow_id = flow["id"]
    flow_assistente_id = flow.get("assistente_id")
    flow_tenant_id = flow.get("tenant_id")

    # Buscar blocos existentes pra cálculo de order_index
    blocos_resp = (
        client.table("flow_blocks")
        .select("block_key, order_index")
        .eq("flow_id", flow_id)
        .order("order_index")
        .execute()
    )
    blocos = list(blocos_resp.data or [])
    acoes_executadas: List[Dict[str, Any]] = []

    for acao in acoes_para_executar:
        acao_tipo = (acao.get("acao") or "").lower()
        block_key = acao.get("block_key") or ""
        try:
            # ════════════════════════════════════════
            # UPDATE
            # ════════════════════════════════════════
            if acao_tipo == "update":
                update_data: Dict[str, Any] = {"content": acao.get("novo_valor") or ""}
                # Campos opcionais
                if acao.get("routes_data") is not None:
                    update_data["routes_data"] = acao["routes_data"]
                if acao.get("tool_config") is not None:
                    update_data["tool_config"] = acao["tool_config"]
                if acao.get("variable_name") is not None:
                    update_data["variable_name"] = acao["variable_name"]
                if acao.get("analyze_variable") is not None:
                    update_data["analyze_variable"] = acao["analyze_variable"]
                if acao.get("end_type") is not None:
                    update_data["end_type"] = acao["end_type"]
                if acao.get("end_metadata") is not None:
                    update_data["end_metadata"] = acao["end_metadata"]
                client.table("flow_blocks").update(update_data).eq("flow_id", flow_id).eq(
                    "block_key", block_key
                ).execute()
                acoes_executadas.append({"acao": "update", "block_key": block_key, "success": True})

            # ════════════════════════════════════════
            # CREATE
            # ════════════════════════════════════════
            elif acao_tipo == "create":
                inserir_depois_de = acao.get("inserir_depois_de")
                order_index = acao.get("order_index")
                if order_index is None and inserir_depois_de and blocos:
                    order_index = _grazi_order_index(blocos, inserir_depois_de)
                if order_index is None:
                    order_index = 100
                block_type = acao.get("block_type") or "mensagem"
                content = acao.get("novo_valor") or ""
                route_ctx = acao.get("route_context")

                # Gerar block_key sequencial
                block_key = _next_block_key(flow_id, block_type)
                logger.info("apply_grazi_actions: create block_key=%s tipo=%s", block_key, block_type)

                # ── Construir insert_data com TODOS os campos ──
                insert_data: Dict[str, Any] = {
                    "flow_id": flow_id,
                    "assistente_id": flow_assistente_id,
                    "tenant_id": flow_tenant_id,
                    "block_key": block_key,
                    "block_type": block_type,
                    "content": content,
                    "order_index": order_index,
                }
                # FIX v1.7.3: incluir TODOS os campos opcionais
                if acao.get("routes_data") is not None:
                    insert_data["routes_data"] = acao["routes_data"]
                if acao.get("tool_config") is not None:
                    insert_data["tool_config"] = acao["tool_config"]
                if acao.get("variable_name"):
                    insert_data["variable_name"] = acao["variable_name"]
                if acao.get("analyze_variable"):
                    insert_data["analyze_variable"] = acao["analyze_variable"]
                if acao.get("tool_type"):
                    insert_data["tool_type"] = acao["tool_type"]
                if acao.get("end_type"):
                    insert_data["end_type"] = acao["end_type"]
                if acao.get("end_metadata") and isinstance(acao["end_metadata"], dict):
                    insert_data["end_metadata"] = acao["end_metadata"]
                if route_ctx and isinstance(route_ctx, dict):
                    insert_data["route_context"] = route_ctx

                # ── Lógica de route_context ──
                route_position = (route_ctx or {}).get("route_position")
                parent_router_key = (route_ctx or {}).get("parent_router_block_key")
                route_key_val = (route_ctx or {}).get("route_key")
                prev_key = None

                # FIRST: atualizar destination_block_key da rota
                if route_position == "first" and parent_router_key and route_key_val:
                    router_row = (
                        client.table("flow_blocks")
                        .select("routes_data")
                        .eq("flow_id", flow_id)
                        .eq("block_key", parent_router_key)
                        .limit(1)
                        .execute()
                    )
                    if router_row.data and router_row.data[0].get("routes_data"):
                        routes_data = list(router_row.data[0]["routes_data"])
                        for r in routes_data:
                            if isinstance(r, dict) and r.get("route_key") == route_key_val:
                                r["destination_block_key"] = block_key
                                break
                        client.table("flow_blocks").update({"routes_data": routes_data}).eq(
                            "flow_id", flow_id
                        ).eq("block_key", parent_router_key).execute()

                # MIDDLE/LAST: encadear depois do último bloco dedicado da rota
                if route_position in ("middle", "last") and parent_router_key and route_key_val:
                    prev_key = _get_route_last_block_key(client, flow_id, parent_router_key, route_key_val)
                    if prev_key:
                        # Rota já tem blocos dedicados → encadear
                        client.table("flow_blocks").update({"next_block_key": block_key}).eq(
                            "flow_id", flow_id
                        ).eq("block_key", prev_key).execute()
                    else:
                        # FIX v1.7.3: Rota sem blocos dedicados → tratar como "first"
                        logger.info(
                            "apply_grazi_actions: rota %s sem blocos dedicados, tratando como 'first'",
                            route_key_val,
                        )
                        route_position = "first"
                        router_row = (
                            client.table("flow_blocks")
                            .select("routes_data")
                            .eq("flow_id", flow_id)
                            .eq("block_key", parent_router_key)
                            .limit(1)
                            .execute()
                        )
                        if router_row.data and router_row.data[0].get("routes_data"):
                            routes_data = list(router_row.data[0]["routes_data"])
                            for r in routes_data:
                                if isinstance(r, dict) and r.get("route_key") == route_key_val:
                                    r["destination_block_key"] = block_key
                                    break
                            client.table("flow_blocks").update({"routes_data": routes_data}).eq(
                                "flow_id", flow_id
                            ).eq("block_key", parent_router_key).execute()
                        # Atualizar route_context
                        if route_ctx:
                            route_ctx["route_position"] = "first"
                            insert_data["route_context"] = route_ctx

                # ── INSERT ──
                try:
                    client.table("flow_blocks").insert(insert_data).execute()
                except Exception as insert_err:
                    err_msg = str(insert_err).lower()
                    if "unique" in err_msg or "duplicate" in err_msg or "already exists" in err_msg:
                        block_key = _next_block_key(flow_id, block_type)
                        insert_data["block_key"] = block_key
                        logger.warning("apply_grazi_actions: duplicado, retry block_key=%s", block_key)
                        # Re-atualizar referências
                        if route_position == "first" and parent_router_key and route_key_val:
                            router_row = (
                                client.table("flow_blocks")
                                .select("routes_data")
                                .eq("flow_id", flow_id)
                                .eq("block_key", parent_router_key)
                                .limit(1)
                                .execute()
                            )
                            if router_row.data and router_row.data[0].get("routes_data"):
                                routes_data = list(router_row.data[0]["routes_data"])
                                for r in routes_data:
                                    if isinstance(r, dict) and r.get("route_key") == route_key_val:
                                        r["destination_block_key"] = block_key
                                        break
                                client.table("flow_blocks").update({"routes_data": routes_data}).eq(
                                    "flow_id", flow_id
                                ).eq("block_key", parent_router_key).execute()
                        if route_position in ("middle", "last") and prev_key:
                            client.table("flow_blocks").update({"next_block_key": block_key}).eq(
                                "flow_id", flow_id
                            ).eq("block_key", prev_key).execute()
                        client.table("flow_blocks").insert(insert_data).execute()
                    else:
                        raise

                acoes_executadas.append({"acao": "create", "block_key": block_key, "success": True})
                blocos.append({"block_key": block_key, "order_index": order_index})
                blocos.sort(key=lambda b: (b.get("order_index") or 0))

                # Atualizar last_block_key na rota
                if route_position == "last" and parent_router_key and route_key_val:
                    router_row = (
                        client.table("flow_blocks")
                        .select("routes_data")
                        .eq("flow_id", flow_id)
                        .eq("block_key", parent_router_key)
                        .limit(1)
                        .execute()
                    )
                    if router_row.data and router_row.data[0].get("routes_data"):
                        routes_data = list(router_row.data[0]["routes_data"])
                        for r in routes_data:
                            if isinstance(r, dict) and r.get("route_key") == route_key_val:
                                r["last_block_key"] = block_key
                                break
                        client.table("flow_blocks").update({"routes_data": routes_data}).eq(
                            "flow_id", flow_id
                        ).eq("block_key", parent_router_key).execute()
            else:
                acoes_executadas.append(
                    {"acao": acao_tipo, "block_key": block_key, "success": False, "error": "Ação desconhecida"}
                )
        except Exception as e:
            acoes_executadas.append({
                "acao": acao_tipo or "create",
                "block_key": block_key,
                "success": False,
                "error": str(e),
            })
            logger.exception("apply_grazi_actions: falha em %s %s: %s", acao_tipo, block_key, e)

    return acoes_executadas


def update_flow(flow_id: str, data: Dict[str, Any]) -> bool:
    """Update flow metadata."""
    try:
        client = supabase_service._require_client()
        client.table("flows").update(data).eq("id", flow_id).execute()
        return True
    except Exception as e:
        logger.error("update_flow: Erro ao atualizar flow %s: %s", flow_id, e)
        return False


def save_flow(payload) -> Dict[str, Any]:
    """
    Save flow blocks and routes.
    
    ESTRATÉGIA SEGURA: INSERT primeiro, DELETE depois (evita perda de dados se inserção falhar).
    - Insere blocos em lotes pequenos (2 por vez) para evitar timeout
    - Só deleta blocos antigos após inserção bem-sucedida
    - Incrementa version do flow
    
    ⚠️ IMPORTANTE: Desabilite o trigger antes de salvar:
    ALTER TABLE flow_blocks DISABLE TRIGGER trigger_sync_prompt_voz_on_block_change;
    """
    from saas_tools.models.schemas import SaveFlowPayload
    
    if isinstance(payload, dict):
        # Se recebeu dict, converter para SaveFlowPayload
        payload = SaveFlowPayload(**payload)
    
    flow_id = payload.flow_id
    blocks = payload.blocks
    routes = payload.routes
    canal = getattr(payload, "canal", None)  # 'voz' | 'whatsapp' — quando setado, só substitui blocos desse canal

    flow = get_flow(flow_id)
    if not flow:
        return {"success": False, "version": 0, "error": "Flow não encontrado"}

    client = supabase_service._require_client()
    current_version = flow.get("version") or 0
    
    assistente_id = flow.get("assistente_id")
    tenant_id = flow.get("tenant_id")
    
    try:
        # ⚠️ VALIDAÇÃO: Verificar se há blocos antes de deletar
        if not blocks or len(blocks) == 0:
            logger.error("save_flow: ❌ NENHUM BLOCO recebido! Não vou deletar os blocos existentes para evitar perda de dados.")
            return {"success": False, "version": current_version, "error": "Nenhum bloco recebido. Não foi possível salvar."}
        
        # Verificar quantos blocos existem atualmente no banco
        existing_blocks_resp = client.table("flow_blocks").select("block_key").eq("flow_id", flow_id).execute()
        existing_count = len(existing_blocks_resp.data or [])
        logger.info("save_flow: 📊 Blocos existentes no banco: %d | Blocos recebidos: %d", existing_count, len(blocks))
        
        # Se tinha blocos e recebeu menos, avisar mas continuar (pode ser edição parcial)
        if existing_count > 0 and len(blocks) < existing_count:
            logger.warning("save_flow: ⚠️ ATENÇÃO: Tinha %d blocos, recebeu %d. Alguns blocos podem ser deletados!", existing_count, len(blocks))
            # Se recebeu menos de 50% dos blocos existentes, pode ser erro - não deletar
            if len(blocks) < (existing_count * 0.5):
                logger.error("save_flow: ❌ RECEBEU MENOS DE 50%% DOS BLOCOS! Não vou deletar para evitar perda de dados.")
                return {"success": False, "version": current_version, "error": f"Recebeu apenas {len(blocks)} blocos mas existem {existing_count} no banco. Possível erro no frontend."}
        
        # Log dos blocos recebidos
        logger.info("save_flow: 📦 Recebidos %d blocos para salvar", len(blocks))
        for idx, b in enumerate(blocks):
            logger.info("save_flow: Bloco[%d] - key=%s, type=%s, content='%s'", 
                       idx, b.block_key, b.block_type, (b.content or '')[:50])
        
        # Listar block_keys recebidos vs existentes
        received_keys = {b.block_key for b in blocks}
        existing_keys = {row["block_key"] for row in (existing_blocks_resp.data or [])}
        missing_keys = existing_keys - received_keys
        if missing_keys:
            logger.warning("save_flow: ⚠️ Blocos que existem mas NÃO foram recebidos: %s", list(missing_keys))
        
        # ⚠️ ESTRATÉGIA SEGURA: Inserir PRIMEIRO, depois deletar apenas os antigos que não estão na lista nova
        # Isso evita perda de dados se a inserção falhar
        
        block_key_to_id: Dict[str, str] = {}
        if blocks:
            # Log detalhado
            logger.info("save_flow: Recebidos %d blocos para salvar", len(blocks))
            for idx, b in enumerate(blocks):
                logger.info("save_flow: Bloco[%d] - key=%s, type=%s, content_length=%d", 
                           idx, b.block_key, b.block_type, len(b.content or ''))
            # Preparar dados para inserção
            rows = []
            for b in blocks:
                # Validação básica
                if not b.block_key or not b.block_key.strip():
                    logger.error("save_flow: ❌ Bloco sem block_key! Pulando...")
                    continue
                if not b.block_type or not b.block_type.strip():
                    logger.error("save_flow: ❌ Bloco %s sem block_type! Pulando...", b.block_key)
                    continue
                
                # Garantir que content não seja None (é NOT NULL no banco)
                content_value = b.content if b.content is not None else ""
                
                row = {
                    "flow_id": flow_id,
                    "block_key": b.block_key.strip(),
                    "block_type": b.block_type.strip(),
                    "content": content_value,  # Garantir que não seja None
                    "order_index": int(b.order_index) if b.order_index is not None else 0,
                    "position_x": float(b.position_x) if b.position_x is not None else 0.0,
                    "position_y": float(b.position_y) if b.position_y is not None else 0.0,
                }
                
                # Campos opcionais (só adicionar se não forem None)
                if assistente_id:
                    row["assistente_id"] = assistente_id
                if tenant_id:
                    row["tenant_id"] = tenant_id
                if b.variable_name:
                    row["variable_name"] = b.variable_name
                if b.timeout_seconds is not None:
                    row["timeout_seconds"] = b.timeout_seconds
                if b.analyze_variable:
                    row["analyze_variable"] = b.analyze_variable
                # tool_type: DB só aceita buscar_dados, verificar_agenda, agendar, enviar_whatsapp, consultar_documento, webhook
                # Para blocos ferramenta, SEMPRE preencher tool_type (CHECK no banco); mapear tipos Vapi → valores permitidos
                _allowed_tool_types = {"buscar_dados", "verificar_agenda", "agendar", "enviar_whatsapp", "consultar_documento", "webhook"}
                _vapi_to_db_tool_type = {"agendamento": "agendar", "mensagem": "enviar_whatsapp", "documento": "consultar_documento", "encerramento": "webhook"}
                if b.block_type == "ferramenta":
                    _tt = (b.tool_type or "").strip().lower() if b.tool_type else ""
                    if _tt and _tt in _allowed_tool_types:
                        row["tool_type"] = _tt
                    else:
                        row["tool_type"] = _vapi_to_db_tool_type.get(_tt) if _tt else "webhook"
                        if not row["tool_type"]:
                            row["tool_type"] = "webhook"
                        if not _tt:
                            logger.warning("save_flow: ⚠️ Bloco ferramenta %s sem tool_type → usando 'webhook'", b.block_key)
                        elif row["tool_type"] == "webhook":
                            logger.warning("save_flow: ⚠️ Bloco ferramenta %s com tool_type desconhecido '%s' → usando 'webhook'", b.block_key, _tt)
                elif b.tool_type:
                    _tt = (b.tool_type or "").strip().lower()
                    row["tool_type"] = _tt if _tt in _allowed_tool_types else _vapi_to_db_tool_type.get(_tt) or "webhook"
                # tool_config e end_metadata devem ser dict ou None, nunca string vazia
                if b.tool_config and isinstance(b.tool_config, dict) and len(b.tool_config) > 0:
                    row["tool_config"] = b.tool_config
                elif b.tool_config is None or (isinstance(b.tool_config, dict) and len(b.tool_config) == 0):
                    row["tool_config"] = {}  # Valor padrão vazio como dict
                if b.end_type:
                    row["end_type"] = b.end_type
                if b.end_metadata and isinstance(b.end_metadata, dict) and len(b.end_metadata) > 0:
                    row["end_metadata"] = b.end_metadata
                elif b.end_metadata is None or (isinstance(b.end_metadata, dict) and len(b.end_metadata) == 0):
                    row["end_metadata"] = {}  # Valor padrão vazio como dict
                if b.next_block_key:
                    row["next_block_key"] = b.next_block_key
                
                # ⭐ Adicionar routes_data se o bloco for do tipo caminhos (usar b.routes_data do payload primeiro)
                if b.block_type == "caminhos":
                    routes_data = getattr(b, "routes_data", None)
                    if routes_data and isinstance(routes_data, list):
                        row["routes_data"] = routes_data
                        logger.info("save_flow: Bloco %s com %d routes em routes_data (do payload)", b.block_key, len(routes_data))
                    elif routes:
                        block_routes = [r for r in routes if r.block_key == b.block_key]
                        if block_routes:
                            routes_data = []
                            for r in block_routes:
                                routes_data.append({
                                    "route_key": r.route_key or f"{b.block_key}_route_{len(routes_data) + 1}",
                                    "label": r.label or "",
                                    "ordem": r.ordem or len(routes_data) + 1,
                                    "cor": r.cor or "#6b7280",
                                    "keywords": r.keywords or [],
                                    "response": r.response or "",
                                    "destination_type": r.destination_type or "continuar",
                                    "destination_block_key": r.destination_block_key,
                                    "max_loop_attempts": r.max_loop_attempts or 2,
                                    "is_fallback": r.is_fallback or False
                                })
                            row["routes_data"] = routes_data
                            logger.info("save_flow: Bloco %s preparado com %d routes em routes_data (de payload.routes)", b.block_key, len(routes_data))
                
                # route_context: vinculação explícita bloco ↔ rota (first/middle/last)
                route_ctx = getattr(b, "route_context", None)
                if route_ctx and isinstance(route_ctx, dict) and route_ctx.get("parent_router_block_key") and route_ctx.get("route_key"):
                    row["route_context"] = route_ctx
                
                # canal: voz | whatsapp | null. Config (order_index < 0) = null; flow = payload.canal ou do bloco
                order_idx = int(b.order_index) if b.order_index is not None else 0
                if canal is not None:
                    row["canal"] = None if order_idx < 0 else (getattr(b, "canal", None) or canal)
                
                rows.append(row)
                
                # Log detalhado do primeiro bloco para debug
                if len(rows) == 1:
                    logger.info("save_flow: 🔍 Exemplo de dados preparados para inserção:")
                    logger.info("save_flow:   - flow_id: %s", row.get("flow_id"))
                    logger.info("save_flow:   - block_key: %s", row.get("block_key"))
                    logger.info("save_flow:   - block_type: %s", row.get("block_type"))
                    logger.info("save_flow:   - content length: %d", len(row.get("content", "")))
                    logger.info("save_flow:   - assistente_id: %s", row.get("assistente_id"))
                    logger.info("save_flow:   - tenant_id: %s", row.get("tenant_id"))
            # Colunas do schema base flow_blocks (flow_editor_tables.sql) - sem migrations (canal, routes_data, etc.)
            _BASE_FLOW_BLOCK_KEYS = {
                "flow_id", "block_key", "block_type", "content", "variable_name", "timeout_seconds",
                "analyze_variable", "tool_type", "tool_config", "end_type", "end_metadata",
                "next_block_key", "order_index", "position_x", "position_y"
            }

            def _row_base_only(r):
                return {k: v for k, v in r.items() if k in _BASE_FLOW_BLOCK_KEYS}

            # ⚡ MÉTODO SIMPLES E DIRETO: Usar UPSERT (UPDATE ou INSERT) para cada bloco
            logger.info("save_flow: 📥 Salvando %d blocos usando método simples (UPSERT)...", len(rows))
            
            inserted_keys = set()
            updated_keys = set()
            
            for row in rows:
                block_key = row.get("block_key")
                if not block_key:
                    logger.error("save_flow: ❌ Bloco sem block_key! Pulando...")
                    continue
                
                if "tool_config" in row and not isinstance(row["tool_config"], dict):
                    row["tool_config"] = {}
                if "end_metadata" in row and not isinstance(row["end_metadata"], dict):
                    row["end_metadata"] = {}
                
                def _do_save(r):
                    # UPDATE primeiro
                    upd = client.table("flow_blocks").update(r).eq("flow_id", flow_id).eq("block_key", block_key).execute()
                    if upd.data and len(upd.data) > 0:
                        return "updated", upd.data[0]["id"]
                    # INSERT
                    ins = client.table("flow_blocks").insert([r]).execute()
                    if ins.data and len(ins.data) > 0:
                        return "inserted", ins.data[0]["id"]
                    check = client.table("flow_blocks").select("id").eq("flow_id", flow_id).eq("block_key", block_key).limit(1).execute()
                    if check.data:
                        return "inserted", check.data[0]["id"]
                    return None, None

                try:
                    status, pk = _do_save(row)
                    if status == "updated":
                        updated_keys.add(block_key)
                        block_key_to_id[block_key] = pk
                        logger.info("save_flow: ✅ Bloco %s atualizado", block_key)
                    elif status == "inserted":
                        inserted_keys.add(block_key)
                        block_key_to_id[block_key] = pk
                        logger.info("save_flow: ✅ Bloco %s inserido", block_key)
                    else:
                        logger.warning("save_flow: ⚠️ Bloco %s não foi inserido nem atualizado", block_key)
                except Exception as e:
                    error_str = str(e)
                    logger.error(
                        "save_flow: ❌ FALHA ao salvar bloco %s (tipo=%s): %s",
                        block_key,
                        row.get("block_type", "?"),
                        error_str[:300],
                    )
                    # Fallback: tentar só com colunas do schema base (sem canal, routes_data, assistente_id, etc.)
                    if "column" in error_str.lower() and ("does not exist" in error_str.lower() or "unknown" in error_str.lower() or "routes_data" in error_str or "canal" in error_str or "assistente_id" in error_str or "tenant_id" in error_str or "route_context" in error_str):
                        try:
                            row_base = _row_base_only(row)
                            status2, pk2 = _do_save(row_base)
                            if status2:
                                (updated_keys if status2 == "updated" else inserted_keys).add(block_key)
                                block_key_to_id[block_key] = pk2
                                logger.info("save_flow: ✅ Bloco %s salvo (apenas colunas base)", block_key)
                        except Exception as e2:
                            logger.error(
                                "save_flow: ❌ FALHA ao salvar bloco %s (tipo=%s, fallback base): %s",
                                block_key,
                                row.get("block_type", "?"),
                                str(e2)[:200],
                            )
                    elif "duplicate" in error_str.lower() or "unique" in error_str.lower() or "23505" in error_str:
                        try:
                            upd2 = client.table("flow_blocks").update(_row_base_only(row)).eq("flow_id", flow_id).eq("block_key", block_key).execute()
                            if upd2.data:
                                updated_keys.add(block_key)
                                block_key_to_id[block_key] = upd2.data[0]["id"]
                                logger.info("save_flow: ✅ Bloco %s atualizado após duplicata", block_key)
                        except Exception as e2:
                            logger.error("save_flow: ❌ Erro UPDATE após duplicata: %s", str(e2)[:200])
            
            # Resumo do que foi salvo
            total_saved = len(inserted_keys) + len(updated_keys)
            logger.info("save_flow: 📊 Resumo: %d blocos inseridos, %d blocos atualizados, total processado: %d", 
                       len(inserted_keys), len(updated_keys), total_saved)
            
            if updated_keys:
                logger.info("save_flow: ✅ Blocos atualizados: %s", list(updated_keys)[:10])
            if inserted_keys:
                logger.info("save_flow: ✅ Blocos inseridos: %s", list(inserted_keys)[:10])
            
            # Verificar quantos blocos foram realmente salvos
            if not block_key_to_id or len(block_key_to_id) == 0:
                logger.error("save_flow: ❌ NENHUM bloco foi inserido após todas as tentativas!")
                logger.error("save_flow: 📊 Resumo: Tentamos inserir %d blocos, mas nenhum foi inserido com sucesso.", len(blocks))
                logger.error("save_flow: 🔍 Possíveis causas:")
                logger.error("save_flow:   1. ⚠️ TRIGGER AINDA ESTÁ ATIVO!")
                logger.error("save_flow:      Execute no Supabase: ALTER TABLE flow_blocks DISABLE TRIGGER trigger_sync_prompt_voz_on_block_change;")
                logger.error("save_flow:   2. Erro de constraint (UNIQUE ou FOREIGN KEY)")
                logger.error("save_flow:   3. Campos obrigatórios faltando (content, block_key, block_type)")
                logger.error("save_flow:   4. Timeout do banco de dados")
                logger.error("save_flow: 💡 Verifique os logs acima para ver os erros específicos de cada tentativa de inserção.")
                logger.error("save_flow: 📋 Execute o script: supabase/CORRIGIR_AGORA.sql")
                return {
                    "success": False, 
                    "version": current_version, 
                    "error": "Erro ao inserir blocos. Nenhum bloco foi salvo. Os blocos antigos foram preservados. ⚠️ IMPORTANTE: Execute no Supabase SQL Editor: ALTER TABLE flow_blocks DISABLE TRIGGER trigger_sync_prompt_voz_on_block_change; Verifique os logs do servidor para detalhes."
                }
            
            if len(block_key_to_id) < len(blocks):
                missing = [b.block_key for b in blocks if b.block_key not in block_key_to_id]
                logger.warning("save_flow: ⚠️ Apenas %d de %d blocos foram inseridos. Blocos faltando: %s", 
                             len(block_key_to_id), len(blocks), missing)
                # Continuar mesmo assim, mas avisar
            
            logger.info("save_flow: ✅ %d blocos inseridos com sucesso. Agora deletando blocos antigos que não estão na lista nova...", len(block_key_to_id))
            
            # Agora que inserimos com sucesso, deletar blocos antigos que não estão na lista nova
            new_block_keys = {b.block_key for b in blocks}
            try:
                if canal and canal in ("voz", "whatsapp"):
                    # Save por canal: só deletar flow blocks (order_index >= 0) deste canal
                    if canal == "voz":
                        all_blocks_resp = (
                            client.table("flow_blocks")
                            .select("id, block_key, order_index, canal")
                            .eq("flow_id", flow_id)
                            .gte("order_index", 0)
                            .or_("canal.is.null,canal.eq.voz")
                            .execute()
                        )
                    else:
                        all_blocks_resp = (
                            client.table("flow_blocks")
                            .select("id, block_key, order_index, canal")
                            .eq("flow_id", flow_id)
                            .gte("order_index", 0)
                            .eq("canal", "whatsapp")
                            .execute()
                        )
                    all_blocks = all_blocks_resp.data or []
                    old_block_keys = {b["block_key"] for b in all_blocks}
                    keys_to_delete = old_block_keys - new_block_keys
                    ids_to_delete = [b["id"] for b in all_blocks if b["block_key"] in keys_to_delete]
                    if ids_to_delete:
                        logger.info("save_flow: 🗑️ [canal=%s] Deletando %d blocos antigos: %s", canal, len(ids_to_delete), list(keys_to_delete))
                        client.table("flow_blocks").delete().in_("id", ids_to_delete).execute()
                    else:
                        logger.info("save_flow: ✅ [canal=%s] Nenhum bloco antigo precisa ser deletado", canal)
                else:
                    # Comportamento legado: todos os blocos do flow
                    all_blocks_resp = client.table("flow_blocks").select("id, block_key, created_at").eq("flow_id", flow_id).order("created_at", desc=True).execute()
                    all_blocks = all_blocks_resp.data or []
                    seen_keys = {}
                    duplicate_ids_to_delete = []
                    for block in all_blocks:
                        key = block["block_key"]
                        if key in seen_keys:
                            duplicate_ids_to_delete.append(block["id"])
                        else:
                            seen_keys[key] = block["id"]
                    if duplicate_ids_to_delete:
                        logger.info("save_flow: 🗑️ Deletando %d blocos duplicados", len(duplicate_ids_to_delete))
                        client.table("flow_blocks").delete().in_("id", duplicate_ids_to_delete).execute()
                    old_block_keys = set(seen_keys.keys())
                    keys_to_delete = old_block_keys - new_block_keys
                    if keys_to_delete:
                        ids_to_delete = [seen_keys[key] for key in keys_to_delete if key in seen_keys]
                        if ids_to_delete:
                            logger.info("save_flow: 🗑️ Deletando %d blocos antigos que não estão na lista nova: %s", len(keys_to_delete), list(keys_to_delete))
                            client.table("flow_blocks").delete().in_("id", ids_to_delete).execute()
                    else:
                        logger.info("save_flow: ✅ Nenhum bloco antigo precisa ser deletado (todos estão na lista nova)")
            except Exception as e:
                logger.warning("save_flow: ⚠️ Erro ao limpar blocos antigos (continuando): %s", str(e)[:200])
            
            # ⚠️ DEPRECATED: Routes agora estão em routes_data (JSONB) dentro de flow_blocks
            # Não precisa deletar flow_routes separadamente
            logger.info("save_flow: ⚠️ Pulando deleção de flow_routes (routes agora em routes_data)")
            
            # Buscar IDs finais dos blocos inseridos (caso algum não tenha sido mapeado)
            try:
                final_resp = client.table("flow_blocks").select("id, block_key").eq("flow_id", flow_id).execute()
                for row in (final_resp.data or []):
                    if row["block_key"] not in block_key_to_id:
                        block_key_to_id[row["block_key"]] = row["id"]
                logger.info("save_flow: ✅ Mapeamento final: %d blocos mapeados", len(block_key_to_id))
            except Exception as e:
                logger.warning("save_flow: ⚠️ Erro ao buscar IDs finais: %s", str(e)[:200])
            
            # Verificação final: garantir que temos pelo menos alguns blocos inseridos
            if len(block_key_to_id) == 0:
                logger.error("save_flow: ❌ CRÍTICO: Nenhum bloco foi inserido após todas as tentativas!")
                return {"success": False, "version": current_version, "error": "Falha ao inserir blocos. Os blocos antigos foram preservados."}
            
            # ANTIGO CÓDIGO (removido - inserção em lote única que causava timeout):
            # try:
            #     insert_result = client.table("flow_blocks").insert(rows).execute()
            #     logger.info("save_flow: ✅ Tentativa de inserir %d blocos", len(rows))

        # 4. ⚠️ DEPRECATED: Routes agora estão em routes_data (JSONB) dentro de flow_blocks
        # Não precisa deletar/inserir em flow_routes separadamente
        logger.info("save_flow: ⚠️ Pulando inserção em flow_routes (routes agora em routes_data)")
        
        # 5. ⚠️ DEPRECATED: Routes agora estão em routes_data (JSONB) dentro de flow_blocks
        # Routes já foram salvas junto com os blocos durante a inserção acima
        logger.info("save_flow: ✅ Routes salvas em routes_data dos blocos (não precisa inserir em flow_routes)")
        
        # Código antigo removido - routes agora em routes_data
        # Routes já foram salvas junto com os blocos durante a inserção acima (linha ~600)

        # 5. REMOVIDO: Atualização de prompt_voz
        # Agora apenas atualizamos flow_blocks diretamente
        # O prompt_voz não é mais sincronizado automaticamente
        logger.info("save_flow: ✅ Blocos salvos em flow_blocks. prompt_voz não é mais atualizado automaticamente.")
        
        # 6. Incrementar version
        new_version = current_version + 1
        client.table("flows").update({"version": new_version}).eq("id", flow_id).execute()

        return {"success": True, "version": new_version}
    except Exception as e:
        import traceback
        error_str = str(e)
        error_full = traceback.format_exc()
        logger.error("save_flow: ❌ ERRO GERAL: %s", error_str)
        logger.error("save_flow: 📋 Traceback completo:\n%s", error_full)
        
        # Tentar preservar a versão atual
        try:
            current_version = flow.get("version") or 0 if flow else 0
        except:
            current_version = 0
        
        return {
            "success": False, 
            "version": current_version, 
            "error": f"Erro ao salvar flow: {error_str}. Verifique os logs do servidor para detalhes."
        }
