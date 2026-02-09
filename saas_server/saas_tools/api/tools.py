from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from typing import Any, Dict, Optional
import logging
import json
import time
from pathlib import Path

from saas_tools.models.schemas import ToolCreate, ToolUpdate
from saas_tools.services.supabase_service import supabase_service
from saas_tools.services.file_service import file_service

logger = logging.getLogger(__name__)
ROOT = Path(__file__).resolve().parents[3]

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

router = APIRouter(tags=["tools"])


def _normalize_tool(row: Dict[str, Any]) -> Dict[str, Any]:
    """Garante formato esperado pelo frontend (tabela vapi_tools; vapi_tool_id preenchido pelo n8n)."""
    return {
        "id": str(row.get("id", "")),
        "tenant_id": str(row.get("tenant_id", "")),
        "assistant_id": row.get("assistant_id"),
        "tool_name": str(row.get("tool_name", "")),
        "tool_type": str(row.get("tool_type", "mensagem")),
        "file_type": row.get("file_type"),
        "is_active": bool(row.get("is_active", True)),
        "instancia": row.get("instancia"),
        "mensagem": row.get("mensagem"),
        "file_url": row.get("file_url"),
        "prompt_instructions": row.get("prompt_instructions"),
        "vapi_tool_id": row.get("vapi_tool_id"),
        "created_at": str(row["created_at"]) if row.get("created_at") is not None else None,
        "updated_at": str(row["updated_at"]) if row.get("updated_at") is not None else None,
    }


@router.get("/tools/{tenant_id}")
async def get_tools(tenant_id: str, assistant_id: Optional[str] = Query(None)):
    """Busca tools do tenant (opcionalmente filtradas por assistant_id)."""
    try:
        _debug_log(
            "saas_tools/api/tools.py:get_tools",
            "get tools request",
            {"tenant_id": tenant_id, "assistant_id": assistant_id},
            "H3",
        )
        tools = supabase_service.get_tools_by_tenant(tenant_id, assistant_id=assistant_id)
        normalized = [_normalize_tool(t) for t in tools]
        return {"success": True, "total": len(normalized), "tools": normalized}
    except Exception as e:
        _debug_log(
            "saas_tools/api/tools.py:get_tools",
            "get tools error",
            {"tenant_id": tenant_id, "error": str(e)},
            "H3",
        )
        logger.error(f"Erro ao buscar tools: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tools")
async def create_tool(tool: ToolCreate):
    """Cria uma nova tool; assistant_id obrigatório (evita tool órfã)."""
    try:
        if not (tool.assistant_id and tool.assistant_id.strip()):
            raise HTTPException(status_code=400, detail="assistant_id é obrigatório")
        if tool.tool_type == "mensagem" and not tool.instancia:
            raise HTTPException(status_code=400, detail="Instância é obrigatória para tools de mensagem")

        tool_data = tool.model_dump()
        created_tool = supabase_service.create_tool(tool_data)
        if not created_tool:
            raise HTTPException(status_code=500, detail="Erro ao criar tool")

        return {"success": True, "message": "Tool criada com sucesso", "tool": created_tool}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar tool: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/tools/{tool_id}")
async def update_tool(tool_id: str, tool: ToolUpdate):
    """Atualiza uma tool existente (igual vapi-tools-manager)."""
    try:
        update_data = {k: v for k, v in tool.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

        from datetime import datetime

        update_data["updated_at"] = datetime.now().isoformat()

        existing_tool = supabase_service.get_tool_by_id(tool_id, "")
        if not existing_tool:
            raise HTTPException(status_code=404, detail="Tool não encontrada")

        tenant_id = existing_tool.get("tenant_id")
        updated_tool = supabase_service.update_tool(tool_id, tenant_id, update_data)
        if not updated_tool:
            raise HTTPException(status_code=500, detail="Erro ao atualizar tool")

        return {"success": True, "message": "Tool atualizada com sucesso", "tool": updated_tool}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar tool: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tools/{tool_id}")
async def delete_tool(tool_id: str, tenant_id: str):
    """Desativa uma tool (soft delete) (igual vapi-tools-manager)."""
    try:
        success = supabase_service.delete_tool(tool_id, tenant_id)
        if not success:
            raise HTTPException(status_code=404, detail="Tool não encontrada")
        return {"success": True, "message": "Tool desativada com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao deletar tool: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tools/upload")
async def upload_file(file: UploadFile = File(...), tenant_id: str = Form(...)):
    """Upload de arquivo para Supabase Storage (igual vapi-tools-manager)."""
    try:
        file_content = await file.read()
        is_valid, error_msg = file_service.validate_file(file.filename, len(file_content))
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_msg)

        result = await file_service.upload_file(
            file_content=file_content,
            filename=file.filename,
            tenant_id=tenant_id,
            content_type=file.content_type or "application/octet-stream",
        )
        return {"success": True, **result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/instances/{tenant_id}")
async def get_instances(tenant_id: str):
    """Busca instâncias WhatsApp conectadas de um tenant (igual vapi-tools-manager)."""
    try:
        instances = supabase_service.get_instances_by_tenant(tenant_id)
        return {"success": True, "total": len(instances), "instances": instances}
    except Exception as e:
        logger.error(f"Erro ao buscar instâncias: {e}")
        raise HTTPException(status_code=500, detail=str(e))

