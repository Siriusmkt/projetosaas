import { useState, useCallback } from 'react';
import { FlowBlock, RouterRoute, ROUTER_COLORS, FALLBACK_COLOR } from '@/types/flow';
import { useToast } from '@/hooks/use-toast';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

// Interface para blocos vindos da API
interface APIFlowBlock {
  blockKey: string;
  type: string;
  content: string;
  toolType?: string;
  variableName?: string;
  analyzeVariable?: string;
  routes?: {
    routeKey: string;
    label: string;
    keywords: string[];
    response?: string;
    destinationBlockKey?: string;
    isFallback?: boolean;
  }[];
  nextBlockKey?: string | null;
  endType?: string;
  timeout?: number;
}

interface APIResponse {
  blocks: APIFlowBlock[];
  promptBase?: string;
}

// Mapeia tipo da API para tipo do Flow
function mapBlockType(apiType: string): FlowBlock['type'] {
  switch (apiType) {
    case 'primeira_mensagem': return 'primeira_mensagem';
    case 'texto': return 'texto';
    case 'aguardar': return 'aguardar';
    case 'multi_condicional': return 'ramificacoes';
    case 'encerrar': return 'encerrar';
    case 'ferramenta': return 'tool';
    default: return 'texto';
  }
}

export function useBlockGenerator() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBlocks = useCallback(async (promptMaster: string): Promise<{ blocks: FlowBlock[]; promptBase?: string }> => {
    if (!promptMaster.trim()) {
      toast({
        variant: 'destructive',
        title: 'Prompt vazio',
        description: 'Digite um prompt master antes de gerar os blocos.',
      });
      return { blocks: [] };
    }

    setIsGenerating(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate-blocks',
          promptMaster,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao gerar blocos');
      }

      const data: APIResponse = await resp.json();
      
      if (!data.blocks || !Array.isArray(data.blocks) || data.blocks.length === 0) {
        throw new Error('Nenhum bloco foi gerado');
      }

      // Criar mapa de blockKey -> ID para resolver referências
      const blockKeyToId: Record<string, string> = {};
      const apiBlocks = data.blocks;
      
      // Primeira passada: criar IDs para todos os blocos
      apiBlocks.forEach((block) => {
        const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        blockKeyToId[block.blockKey] = id;
      });

      // Segunda passada: converter blocos com referências resolvidas
      const flowBlocks: FlowBlock[] = apiBlocks.map((block) => {
        const id = blockKeyToId[block.blockKey];
        const type = mapBlockType(block.type);
        
        const flowBlock: FlowBlock = {
          id,
          type,
          content: block.content,
          timeout: block.timeout,
          nextBlock: block.nextBlockKey ? blockKeyToId[block.nextBlockKey] || null : null,
        };

        // Processar ramificações/multi_condicional
        if (type === 'ramificacoes' && block.routes) {
          flowBlock.analyzeVariable = block.analyzeVariable || '{{ultima_resposta}}';
          
          // Separar rotas normais do fallback
          const normalRoutes = block.routes.filter(r => !r.isFallback);
          const fallbackRoute = block.routes.find(r => r.isFallback);
          
          // Converter rotas
          flowBlock.routes = normalRoutes.map((route, index): RouterRoute => ({
            id: `route_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
            label: route.label,
            color: ROUTER_COLORS[index % ROUTER_COLORS.length].hex,
            keywords: route.keywords || [],
            response: route.response || '',
            destinationType: route.destinationBlockKey ? 'goto' : 'continue',
            gotoBlockId: route.destinationBlockKey ? blockKeyToId[route.destinationBlockKey] || null : null,
          }));
          
          // Converter fallback
          if (fallbackRoute) {
            flowBlock.fallback = {
              label: fallbackRoute.label || 'Outros',
              response: fallbackRoute.response || 'Pode repetir?',
              destinationType: fallbackRoute.destinationBlockKey ? 'goto' : 'loop',
              gotoBlockId: fallbackRoute.destinationBlockKey ? blockKeyToId[fallbackRoute.destinationBlockKey] || null : null,
            };
          } else {
            flowBlock.fallback = {
              label: 'Outros',
              response: 'Pode repetir? Não entendi.',
              destinationType: 'loop',
              gotoBlockId: null,
            };
          }
        }

        // Processar ferramenta
        if (block.toolType) {
          flowBlock.toolType = block.toolType as FlowBlock['toolType'];
        }

        return flowBlock;
      });

      const totalRoutes = flowBlocks
        .filter(b => b.type === 'ramificacoes')
        .reduce((acc, b) => acc + (b.routes?.length || 0), 0);

      toast({
        title: 'Fluxo gerado com sucesso!',
        description: `${flowBlocks.length} blocos criados${totalRoutes > 0 ? ` com ${totalRoutes} caminhos` : ''}.`,
      });

      return {
        blocks: flowBlocks,
        promptBase: data.promptBase,
      };
    } catch (e) {
      console.error('Generate blocks error:', e);
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar fluxo',
        description: e instanceof Error ? e.message : 'Erro desconhecido',
      });
      return { blocks: [] };
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  return {
    isGenerating,
    generateBlocks,
  };
}
