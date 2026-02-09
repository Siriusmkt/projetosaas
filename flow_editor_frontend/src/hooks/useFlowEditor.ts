import { useState, useCallback } from 'react';
import { FlowBlock, FlowData, createBlock, FlowBlockType, ToolBlockType, generateFlowExportJson, FlowExportJson } from '@/types/flow';
import { useToast } from '@/hooks/use-toast';
import { useBlockGenerator } from '@/hooks/useBlockGenerator';

// Fluxo inicia vazio - sem dados de exemplo
const INITIAL_BLOCKS: FlowBlock[] = [];

// Prompt Master inicia vazio
const INITIAL_PROMPT = '';

export function useFlowEditor() {
  const { toast } = useToast();
  const { isGenerating, generateBlocks } = useBlockGenerator();
  const [promptMaster, setPromptMaster] = useState(INITIAL_PROMPT);
  const [blocks, setBlocks] = useState<FlowBlock[]>(INITIAL_BLOCKS);

  const addBlock = useCallback((
    type: FlowBlockType, 
    toolType?: ToolBlockType,
    parentConditionId?: string,
    branchType?: 'yes' | 'no',
    customContent?: string
  ): FlowBlock => {
    const newBlock = createBlock(type, toolType, parentConditionId, branchType);
    // Se tiver conteúdo customizado, usa ele
    if (customContent) {
      newBlock.content = customContent;
    }
    
    setBlocks(prev => [...prev, newBlock]);
    
    return newBlock;
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<FlowBlock>) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
  }, []);

  const moveBlock = useCallback((id: string, direction: -1 | 1) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index === -1) return prev;
      
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks;
    });
  }, []);

  // Move block to a new position via drag & drop
  const moveBlockToPosition = useCallback((
    blockId: string,
    afterBlockId: string | null, // null = first position
    parentConditionId?: string | null,
    branchType?: 'yes' | 'no' | null
  ) => {
    setBlocks(prev => {
      const blockIndex = prev.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return prev;
      
      const block = prev[blockIndex];
      const newBlocks = prev.filter(b => b.id !== blockId);
      
      // Update block's branch info
      const updatedBlock: FlowBlock = {
        ...block,
        parentConditionId: parentConditionId || null,
        branchType: branchType || null,
      };
      
      // Find insertion point
      if (afterBlockId) {
        const afterIndex = newBlocks.findIndex(b => b.id === afterBlockId);
        if (afterIndex !== -1) {
          newBlocks.splice(afterIndex + 1, 0, updatedBlock);
        } else {
          newBlocks.push(updatedBlock);
        }
      } else {
        // Insert at beginning
        newBlocks.unshift(updatedBlock);
      }
      
      return newBlocks;
    });
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    const blockToDuplicate = blocks.find(b => b.id === id);
    if (!blockToDuplicate) return;
    
    const newBlock = createBlock(
      blockToDuplicate.type, 
      blockToDuplicate.toolType,
      blockToDuplicate.parentConditionId ?? undefined,
      blockToDuplicate.branchType ?? undefined
    );
    newBlock.content = blockToDuplicate.content + ' (cópia)';
    
    setBlocks(prev => [...prev, newBlock]);
    
    toast({
      title: 'Bloco duplicado',
      description: 'Uma cópia do bloco foi criada.',
    });
  }, [blocks, toast]);

  const saveFlow = useCallback((): FlowData => {
    const data: FlowData = { promptMaster, blocks };
    localStorage.setItem('flowData', JSON.stringify(data));
    toast({
      title: 'Fluxo salvo',
      description: 'Seu fluxo foi salvo com sucesso.',
    });
    return data;
  }, [promptMaster, blocks, toast]);

  // Exportar JSON completo formatado
  const exportFlowJson = useCallback((): FlowExportJson => {
    const exportData = generateFlowExportJson(promptMaster, blocks);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'JSON exportado',
      description: `Arquivo com ${exportData.metadata.totalBlocks} blocos e ${exportData.metadata.totalRamificacoes} ramificações.`,
    });
    return exportData;
  }, [promptMaster, blocks, toast]);

  const exportFlow = useCallback(() => {
    const data: FlowData = { promptMaster, blocks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow-data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Fluxo exportado',
      description: 'O arquivo JSON foi baixado.',
    });
  }, [promptMaster, blocks, toast]);

  const previewFlow = useCallback(() => {
    let preview = '=== PROMPT MASTER ===\n';
    preview += promptMaster + '\n\n';
    preview += '=== FLUXO ===\n\n';
    
    blocks.forEach((block, i) => {
      const label = block.type === 'tool' ? block.toolType : block.type;
      preview += `[${i + 1}] ${label}\n`;
      preview += `    ${block.content}\n`;
      if (block.type === 'ramificacoes' && block.routes) {
        preview += `    📍 ${block.routes.length} caminhos configurados\n`;
        block.routes.forEach((route, idx) => {
          preview += `       ${idx + 1}. ${route.label}: [${route.keywords.join(', ')}] → ${route.destinationType}\n`;
        });
      }
      preview += '\n';
    });
    
    return preview;
  }, [promptMaster, blocks]);

  const generateBlocksFromPrompt = useCallback(async () => {
    const result = await generateBlocks(promptMaster);
    if (result.blocks.length > 0) {
      setBlocks(result.blocks);
      // Se veio promptBase da IA, podemos usar para atualizar o prompt
      if (result.promptBase) {
        setPromptMaster(result.promptBase);
      }
    }
  }, [promptMaster, generateBlocks]);

  const setBlocksDirectly = useCallback((newBlocks: FlowBlock[]) => {
    setBlocks(newBlocks);
  }, []);

  const resetFlow = useCallback(() => {
    setBlocks([]);
    setPromptMaster('');
    toast({
      title: 'Novo fluxo criado',
      description: 'O canvas foi limpo para um novo fluxo.',
    });
  }, [toast]);

  return {
    promptMaster,
    setPromptMaster,
    blocks,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    moveBlockToPosition,
    duplicateBlock,
    saveFlow,
    exportFlow,
    exportFlowJson,
    previewFlow,
    isGenerating,
    generateBlocksFromPrompt,
    setBlocks: setBlocksDirectly,
    resetFlow,
  };
}
