"""
Serviço de Chat IA para Flow Editor
O usuário conversa com a IA e ela aplica mudanças nos blocos automaticamente
"""
import os
import logging
from typing import Dict, Any, List, Optional
import json

logger = logging.getLogger(__name__)

# Importar cliente da IA
try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    logger.warning("Anthropic SDK não disponível")

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI SDK não disponível")


class FlowChatAI:
    """IA conversacional que aplica mudanças nos blocos do flow"""
    
    def __init__(self, provider: str = "openai"):
        self.provider = provider
        
        if provider == "anthropic" and ANTHROPIC_AVAILABLE:
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY não configurada")
            self.client = Anthropic(api_key=api_key)
            self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
        elif provider == "openai" and OPENAI_AVAILABLE:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY não configurada")
            self.client = openai.OpenAI(api_key=api_key)
            self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        else:
            raise ValueError(f"Provedor {provider} não disponível")
    
    def _build_system_prompt(self, current_blocks: List[Dict[str, Any]], prompt_base: str = None) -> str:
        """Constrói o prompt do sistema com contexto dos blocos atuais e prompt_base"""
        blocks_summary = self._summarize_blocks(current_blocks)
        
        prompt_context = ""
        if prompt_base and prompt_base.strip():
            prompt_preview = prompt_base[:300] + ("..." if len(prompt_base) > 300 else "")
            prompt_context = f"""
## PROMPT BASE DO ASSISTENTE

O prompt base atual do assistente é:

```
{prompt_preview}
```

Você pode editar este prompt base quando o usuário pedir mudanças no prompt principal do assistente.
"""
        
        return f"""Você é um assistente especializado em editar fluxos de conversa e prompts para assistentes de voz.

## CONTEXTO ATUAL DO FLOW

O flow atual tem os seguintes blocos:

{blocks_summary}
{prompt_context}

## SUA TAREFA

O usuário vai conversar com você pedindo mudanças no flow. Você deve:
1. **Entender** o que o usuário quer mudar
2. **Aplicar** as mudanças nos blocos
3. **Retornar** um JSON com as mudanças a serem aplicadas

## FORMATO DE RESPOSTA

Sempre retorne um JSON válido com esta estrutura:

```json
{{
  "message": "Mensagem de resposta ao usuário explicando o que foi feito",
  "changes": {{
    "prompt_base": "Novo prompt base do assistente (se o usuário pediu para editar o prompt)",
    "blocks_to_update": [
      {{
        "block_key": "MSG001",
        "updates": {{
          "content": "Novo conteúdo",
          "next_block_key": "MSG002"
        }}
      }}
    ],
    "blocks_to_create": [
      {{
        "block_type": "mensagem",
        "content": "Conteúdo do novo bloco",
        "order_index": 20,
        "next_block_key": "MSG003"
      }}
    ],
    "blocks_to_delete": ["MSG005"],
    "routes_to_update": {{
      "CAM001": {{
        "routes_data": [
          {{
            "route_key": "CAM001_route_1",
            "label": "Sim",
            "keywords": ["sim", "sou eu"],
            "response": "Ótimo!",
            "destination_type": "continuar",
            "destination_block_key": "MSG001",
            "is_fallback": false,
            "ordem": 1,
            "cor": "#22c55e"
          }}
        ]
      }}
    }}
  }}
}}
```

## TIPOS DE COMANDOS QUE VOCÊ DEVE ENTENDER

1. **Editar prompt base**: "Mude o prompt para dizer X", "Atualize o prompt base do assistente", "O prompt deve incluir Y"
2. **Adicionar bloco**: "Adicione uma mensagem que diz X", "Crie um bloco de aguardar para coletar o nome"
3. **Modificar bloco**: "Mude a mensagem MSG001 para dizer Y", "Atualize o conteúdo do bloco CAM001"
4. **Deletar bloco**: "Remova o bloco MSG005", "Delete o bloco de encerramento"
5. **Adicionar rota**: "Adicione uma rota no CAM001 para quando disser 'sim'", "Crie um caminho para resposta positiva"
6. **Modificar rota**: "Mude a rota 1 do CAM001 para ir para MSG003", "Atualize as keywords da rota de confirmação"
7. **Reordenar**: "Mova MSG002 para depois de MSG001", "Troque a ordem dos blocos"

## REGRAS IMPORTANTES

- Use `block_key` (ex: "MSG001") para identificar blocos, não IDs
- Para blocos de tipo "caminhos", sempre inclua `routes_data` completo
- Mantenha a ordem lógica dos blocos usando `order_index`
- Se criar um novo bloco, gere um `block_key` apropriado (MSG001, CAM001, etc.)
- Seja claro na mensagem de resposta explicando o que foi feito

## EXEMPLOS DE COMANDOS E RESPOSTAS

**Usuário**: "Mude o prompt base para dizer que sou uma assistente de vendas especializada em produtos premium"

**Você**:
```json
{{
  "message": "✅ Atualizei o prompt base do assistente para incluir que você é uma assistente de vendas especializada em produtos premium.",
  "changes": {{
    "prompt_base": "Você é uma assistente de vendas especializada em produtos premium..."
  }}
}}
```

**Usuário**: "Adicione uma mensagem inicial que diz 'Olá, como posso ajudar?'"

**Você**:
```json
{{
  "message": "✅ Adicionei uma nova mensagem inicial 'Olá, como posso ajudar?' como primeiro bloco do flow.",
  "changes": {{
    "blocks_to_create": [
      {{
        "block_type": "primeira_mensagem",
        "content": "Olá, como posso ajudar?",
        "order_index": 0,
        "next_block_key": null
      }}
    ]
  }}
}}
```

**Usuário**: "Mude a mensagem MSG001 para 'Bem-vindo à nossa empresa'"

**Você**:
```json
{{
  "message": "✅ Atualizei o conteúdo do bloco MSG001 para 'Bem-vindo à nossa empresa'.",
  "changes": {{
    "blocks_to_update": [
      {{
        "block_key": "MSG001",
        "updates": {{
          "content": "Bem-vindo à nossa empresa"
        }}
      }}
    ]
  }}
}}
```

**Usuário**: "Adicione uma rota no CAM001 para quando a pessoa disser 'talvez' que vai para MSG005"

**Você**:
```json
{{
  "message": "✅ Adicionei uma nova rota no bloco CAM001 para quando disser 'talvez', direcionando para MSG005.",
  "changes": {{
    "routes_to_update": {{
      "CAM001": {{
        "routes_data": [
          // ... rotas existentes ...
          {{
            "route_key": "CAM001_route_3",
            "label": "Talvez",
            "keywords": ["talvez", "pode ser"],
            "response": "",
            "destination_type": "continuar",
            "destination_block_key": "MSG005",
            "is_fallback": false,
            "ordem": 3,
            "cor": "#3b82f6"
          }}
        ]
      }}
    }}
  }}
}}
```

Retorne APENAS o JSON válido, sem markdown adicional."""
    
    def _summarize_blocks(self, blocks: List[Dict[str, Any]]) -> str:
        """Cria um resumo dos blocos atuais"""
        if not blocks:
            return "Nenhum bloco ainda. O flow está vazio."
        
        summary_lines = []
        for block in blocks:
            block_key = block.get("block_key", "SEM_KEY")
            block_type = block.get("block_type", "SEM_TIPO")
            content = block.get("content", "")[:50]
            next_key = block.get("next_block_key")
            
            line = f"- **{block_key}** ({block_type}): {content}"
            if next_key:
                line += f" → {next_key}"
            
            # Se for caminhos, mostrar rotas
            if block_type == "caminhos":
                routes = block.get("routes_data", [])
                if routes:
                    routes_info = ", ".join([f"{r.get('label', '')} → {r.get('destination_block_key', '')}" for r in routes[:3]])
                    line += f" | Rotas: {routes_info}"
            
            summary_lines.append(line)
        
        return "\n".join(summary_lines)
    
    def process_chat_message(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        current_blocks: List[Dict[str, Any]],
        flow_id: str,
        prompt_base: str = None
    ) -> Dict[str, Any]:
        """
        Processa uma mensagem do usuário e retorna as mudanças a serem aplicadas
        
        Args:
            user_message: Mensagem do usuário
            conversation_history: Histórico da conversa (lista de {"role": "user/assistant", "content": "..."})
            current_blocks: Lista de blocos atuais do flow
            flow_id: ID do flow
            prompt_base: Prompt base atual do assistente (opcional)
            
        Returns:
            Dict com "message" (resposta da IA) e "changes" (mudanças a aplicar)
        """
        system_prompt = self._build_system_prompt(current_blocks, prompt_base)
        
        # Construir histórico de mensagens
        messages = []
        for msg in conversation_history[-10:]:  # Últimas 10 mensagens
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # Adicionar mensagem atual
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        try:
            if self.provider == "anthropic":
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=2048,
                    system=system_prompt,
                    messages=messages
                )
                response_text = response.content[0].text
            else:  # OpenAI
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        *messages
                    ],
                    temperature=0.3,
                    max_tokens=2048
                )
                response_text = response.choices[0].message.content
            
            # Extrair JSON da resposta
            json_text = response_text.strip()
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(json_text)
            
            logger.info(f"✅ [FlowChatAI] Processou mensagem e retornou mudanças")
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ [FlowChatAI] Erro ao fazer parse do JSON: {e}")
            logger.error(f"Resposta da IA: {response_text[:500]}")
            return {
                "message": "Desculpe, ocorreu um erro ao processar sua solicitação. Tente reformular.",
                "changes": {}
            }
        except Exception as e:
            logger.error(f"❌ [FlowChatAI] Erro ao processar mensagem: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {
                "message": f"Erro ao processar: {str(e)}",
                "changes": {}
            }


def process_flow_chat(
    user_message: str,
    conversation_history: List[Dict[str, str]],
    current_blocks: List[Dict[str, Any]],
    flow_id: str,
    provider: str = "openai",
    prompt_base: str = None
) -> Dict[str, Any]:
    """
    Função helper para processar mensagem de chat
    
    Args:
        user_message: Mensagem do usuário
        conversation_history: Histórico da conversa
        current_blocks: Blocos atuais
        flow_id: ID do flow
        provider: "anthropic" ou "openai"
        prompt_base: Prompt base atual do assistente (opcional)
        
    Returns:
        Dict com "message" e "changes"
    """
    chat_ai = FlowChatAI(provider=provider)
    return chat_ai.process_chat_message(user_message, conversation_history, current_blocks, flow_id, prompt_base)
