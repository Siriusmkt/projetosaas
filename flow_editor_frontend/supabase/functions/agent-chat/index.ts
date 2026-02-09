import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface FlowRoute {
  routeKey: string;
  label: string;
  keywords: string[];
  response?: string;
  destinationBlockKey?: string;
  isFallback?: boolean;
}

interface FlowBlock {
  blockKey: string;
  type: "primeira_mensagem" | "texto" | "aguardar" | "multi_condicional" | "encerrar" | "ferramenta";
  content: string;
  toolType?: string;
  variableName?: string;
  analyzeVariable?: string;
  routes?: FlowRoute[];
  nextBlockKey?: string | null;
  endType?: string;
  timeout?: number;
}

interface ParsedFlow {
  blocks: FlowBlock[];
  promptBase?: string;
}

// Parser que entende o formato estruturado do prompt
function parseStructuredPrompt(promptText: string): ParsedFlow | null {
  const blocks: FlowBlock[] = [];
  
  // Extrai o prompt base (tudo antes do FLUXO DA CONVERSA)
  const promptBaseMatch = promptText.match(/^([\s\S]*?)(?=## FLUXO DA CONVERSA|### ABERTURA)/i);
  const promptBase = promptBaseMatch ? promptBaseMatch[1].trim() : undefined;
  
  // Padrões para identificar blocos
  const patterns = {
    // ABERTURA DA LIGACAO / PRIMEIRA MENSAGEM
    abertura: /###\s*ABERTURA.*?\n\n\*\*(?:Ao iniciar.*?|Fale:)\*\*\s*\n*"([^"]+)"[\s\S]*?(?:\*\*Depois:\*\*\s*Va para \[([A-Z]+\d+)\])?/gi,
    
    // AGUARDAR [AG001]
    aguardar: /###\s*AGUARDAR\s*\[([A-Z]+\d+)\]\s*\n\n\*\*Escute.*?\*\*\s*\n(?:Salvar resposta.*?em:\s*`\{\{(\w+)\}\}`)?\s*\n*\*\*Depois:\*\*\s*Va para \[([A-Z]+\d+)\]/gi,
    
    // MENSAGEM [MSG001]
    mensagem: /###\s*MENSAGEM\s*\[([A-Z]+\d+)\]\s*\n\n\*\*Fale:\*\*\s*\n*"([^"]+)"[\s\S]*?\*\*Depois:\*\*\s*Va para \[([A-Z]+\d+)\]/gi,
    
    // CAMINHOS [CAM001] - multi-condicional
    caminhos: /###\s*CAMINHOS\s*\[([A-Z]+\d+)\]\s*\n\n\*\*Analisando:\*\*\s*`\{\{(\w+)\}\}`\s*\n\n\*\*([^*]+)\*\*\s*([\s\S]*?)(?=###|---|\n\n---)/gi,
    
    // ENCERRAR [ENC001]
    encerrar: /###\s*ENCERRAR\s*\[([A-Z]+\d+)\]:\s*(\w+)\s*\n\n\*\*Fale antes de encerrar:\*\*\s*\n*"([^"]+)"/gi,
  };
  
  // Parse ABERTURA como primeira_mensagem
  let aberturaMatch = patterns.abertura.exec(promptText);
  if (aberturaMatch) {
    blocks.push({
      blockKey: 'PM001',
      type: 'primeira_mensagem',
      content: aberturaMatch[1].trim(),
      nextBlockKey: aberturaMatch[2] || null,
    });
  }
  
  // Parse AGUARDAR
  let aguardarMatch;
  while ((aguardarMatch = patterns.aguardar.exec(promptText)) !== null) {
    blocks.push({
      blockKey: aguardarMatch[1],
      type: 'aguardar',
      content: 'Aguardando resposta do lead...',
      variableName: aguardarMatch[2] || undefined,
      nextBlockKey: aguardarMatch[3],
      timeout: 30,
    });
  }
  
  // Parse MENSAGEM
  let mensagemMatch;
  while ((mensagemMatch = patterns.mensagem.exec(promptText)) !== null) {
    blocks.push({
      blockKey: mensagemMatch[1],
      type: 'texto',
      content: mensagemMatch[2].trim(),
      nextBlockKey: mensagemMatch[3],
    });
  }
  
  // Parse CAMINHOS (multi-condicional)
  let caminhosMatch;
  while ((caminhosMatch = patterns.caminhos.exec(promptText)) !== null) {
    const blockKey = caminhosMatch[1];
    const analyzeVariable = caminhosMatch[2];
    const question = caminhosMatch[3].trim();
    const routesText = caminhosMatch[4];
    
    // Parse rotas individuais
    const routes: FlowRoute[] = [];
    const routePattern = /\*\*Se o lead disser:\*\*\s*"([^"]+)"[\s\S]*?\*\*Resposta:\*\*\s*"([^"]+)"[\s\S]*?\*\*Depois:\*\*\s*Va para \[([A-Z]+\d+)\]/gi;
    const fallbackPattern = /\*\*Se não entender.*?\*\*[\s\S]*?\*\*Resposta:\*\*\s*"([^"]+)"[\s\S]*?\*\*Depois:\*\*\s*Va para \[([A-Z]+\d+)\]/gi;
    
    let routeMatch;
    let routeIndex = 1;
    while ((routeMatch = routePattern.exec(routesText)) !== null) {
      const keywords = routeMatch[1].split(',').map(k => k.trim().replace(/"/g, ''));
      routes.push({
        routeKey: `${blockKey}_route_${routeIndex}`,
        label: keywords[0] || `Opção ${routeIndex}`,
        keywords,
        response: routeMatch[2].trim(),
        destinationBlockKey: routeMatch[3],
        isFallback: false,
      });
      routeIndex++;
    }
    
    // Parse fallback
    let fallbackMatch = fallbackPattern.exec(routesText);
    if (fallbackMatch) {
      routes.push({
        routeKey: `${blockKey}_fallback`,
        label: 'Fallback',
        keywords: [],
        response: fallbackMatch[1].trim(),
        destinationBlockKey: fallbackMatch[2],
        isFallback: true,
      });
    }
    
    blocks.push({
      blockKey,
      type: 'multi_condicional',
      content: question,
      analyzeVariable,
      routes,
      nextBlockKey: null,
    });
  }
  
  // Parse ENCERRAR
  let encerrarMatch;
  while ((encerrarMatch = patterns.encerrar.exec(promptText)) !== null) {
    blocks.push({
      blockKey: encerrarMatch[1],
      type: 'encerrar',
      content: encerrarMatch[3].trim(),
      endType: encerrarMatch[2],
    });
  }
  
  if (blocks.length === 0) {
    return null;
  }
  
  return { blocks, promptBase };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, promptMaster, blocks, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Action: generate blocks from prompt
    if (action === "generate-blocks") {
      // Primeiro tenta parse estruturado
      const parsedFlow = parseStructuredPrompt(promptMaster);
      
      if (parsedFlow && parsedFlow.blocks.length > 0) {
        console.log(`Parsed ${parsedFlow.blocks.length} blocks from structured prompt`);
        return new Response(JSON.stringify(parsedFlow), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Se não conseguiu parse estruturado, usa IA para gerar
      const systemPrompt = `Você é um especialista em criar fluxos de conversação para assistentes de IA de vendas/SDR.

IMPORTANTE: Analise cuidadosamente o prompt fornecido e identifique:
1. Blocos de ABERTURA/PRIMEIRA MENSAGEM (tipo: primeira_mensagem)
2. Blocos de MENSAGEM/TEXTO (tipo: texto)
3. Blocos de AGUARDAR/ESPERAR RESPOSTA (tipo: aguardar)
4. Blocos de CAMINHOS/CONDIÇÕES com múltiplas rotas (tipo: multi_condicional)
5. Blocos de ENCERRAR/FINALIZAR (tipo: encerrar)

Para blocos multi_condicional, identifique:
- Variável sendo analisada (analyzeVariable)
- Cada rota com: label, keywords (palavras-chave), response (resposta), destinationBlockKey
- Rota fallback para casos não identificados

Retorne APENAS um JSON válido no formato:
{
  "blocks": [
    {
      "blockKey": "PM001",
      "type": "primeira_mensagem",
      "content": "Texto da saudação",
      "nextBlockKey": "AG001"
    },
    {
      "blockKey": "AG001", 
      "type": "aguardar",
      "content": "Aguardando resposta",
      "variableName": "ultima_resposta",
      "timeout": 30,
      "nextBlockKey": "MSG001"
    },
    {
      "blockKey": "MSG001",
      "type": "texto", 
      "content": "Mensagem do agente",
      "nextBlockKey": "CAM001"
    },
    {
      "blockKey": "CAM001",
      "type": "multi_condicional",
      "content": "Pergunta de análise",
      "analyzeVariable": "ultima_resposta",
      "routes": [
        {
          "routeKey": "CAM001_route_1",
          "label": "Opção 1",
          "keywords": ["palavra1", "palavra2"],
          "response": "Resposta se escolher esta opção",
          "destinationBlockKey": "MSG002"
        },
        {
          "routeKey": "CAM001_fallback",
          "label": "Fallback",
          "keywords": [],
          "response": "Resposta padrão",
          "destinationBlockKey": "AG001",
          "isFallback": true
        }
      ]
    },
    {
      "blockKey": "ENC001",
      "type": "encerrar",
      "content": "Mensagem de despedida",
      "endType": "finalizar"
    }
  ],
  "promptBase": "Contexto geral do agente (identidade, regras, etc)"
}

Convenções de blockKey:
- PM = primeira_mensagem
- AG = aguardar
- MSG = texto
- CAM = multi_condicional (caminhos)
- ENC = encerrar

IMPORTANTE: Preserve todos os blocos e rotas do prompt original. Não simplifique ou omita informações.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analise este Prompt Master e gere o fluxo completo de blocos:\n\n${promptMaster}` },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ error: "Erro ao gerar blocos" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      return new Response(JSON.stringify({ error: "Não foi possível gerar os blocos" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: chat with the agent (streaming)
    const flowContext = blocks && blocks.length > 0 
      ? `\n\nFluxo de conversa:\n${(blocks as FlowBlock[]).map((b, i) => {
          const label = b.type === 'ferramenta' ? b.toolType : b.type;
          return `${i + 1}. [${label}] ${b.content}`;
        }).join('\n')}`
      : '';

    const systemMessage = `${promptMaster || "Você é um assistente virtual prestativo."}${flowContext}

INSTRUÇÕES IMPORTANTES:
- Siga o fluxo de conversa definido acima
- Seja natural e conversacional
- Use os blocos de condição para direcionar a conversa
- Quando apropriado, mencione que pode executar ações como agendamento, envio de mídia, etc.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
          ...(messages as ChatMessage[]),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos à sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro ao processar mensagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
