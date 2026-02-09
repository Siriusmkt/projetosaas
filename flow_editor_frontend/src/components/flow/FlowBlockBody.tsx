import { FlowBlock, getBlockLabel, getBlockTypeInfo } from '@/types/flow';
import { VapiTool } from '@/types/vapiTools';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CornerDownRight, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlowBlockIcon } from './FlowBlockIcon';
import { MultiConditionalProperties } from './MultiConditionalProperties';

interface FlowBlockBodyProps {
  block: FlowBlock;
  onUpdate: (updates: Partial<FlowBlock>) => void;
  allBlocks: FlowBlock[];
  vapiTools?: VapiTool[];
}

const VARIABLES = [
  { name: 'Nome', description: 'Nome do lead' },
  { name: 'Empresa', description: 'Empresa do lead' },
  { name: 'Email', description: 'Email do lead' },
  { name: 'Telefone', description: 'Telefone do lead' },
];

export const FlowBlockBody = function FlowBlockBody({ block, onUpdate, allBlocks, vapiTools = [] }: FlowBlockBodyProps) {
  const renderContent = () => {
    switch (block.type) {
      case 'primeira_mensagem':
      case 'texto':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {block.type === 'primeira_mensagem' ? 'Saudação Inicial' : 'Mensagem'}
              </Label>
              <Textarea
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="mt-1.5 min-h-[80px] resize-y"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {VARIABLES.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => onUpdate({ content: block.content + ` {{${v.name}}}` })}
                    className="px-2 py-1 text-xs font-semibold rounded transition-colors hover:opacity-80"
                    style={{ color: 'hsl(262 83% 58%)', background: 'hsl(262 83% 58% / 0.1)' }}
                  >
                    {`{{${v.name}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'ramificacoes':
        // Handled separately at the component level
        return null;

      case 'aguardar':
        return (
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Mensagem (opcional)
            </Label>
            <Textarea
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              placeholder="Mensagem antes de aguardar..."
              className="mt-1.5 min-h-[60px] resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mensagem enviada antes de aguardar resposta do lead
            </p>
          </div>
        );

      case 'encerrar':
        return (
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Motivo do encerramento
            </Label>
            <Input
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="mt-1.5"
            />
          </div>
        );

      case 'tool': {
        // vapi_tools.id em toolConfig.toolId é usado pelo rapid-processor como [tool:UUID]
        const activeTools = vapiTools.filter((tool) => tool.is_active);
        const selectedTool = activeTools.find((tool) => tool.id === block.toolConfig?.toolId);
        const toolId = block.toolConfig?.toolId;
        const instructions =
          block.toolConfig?.promptInstructions ??
          selectedTool?.prompt_instructions ??
          '';

        return (
          <div className="space-y-4">
            {toolId && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  ID (vapi_tools)
                </Label>
                <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded" title={toolId}>
                  ...{toolId.slice(-4)}
                </span>
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Nome da Ação
              </Label>
              <Input
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Trocar ferramenta
              </Label>
              <Select
                value={block.toolConfig?.toolId || ''}
                onValueChange={(newToolId) => {
                  const tool = activeTools.find((item) => item.id === newToolId);
                  if (!tool) return;
                  onUpdate({
                    content: tool.tool_name || block.content,
                    toolType: tool.tool_type,
                    toolConfig: {
                      ...block.toolConfig,
                      toolId: tool.id,
                      toolName: tool.tool_name,
                      toolType: tool.tool_type,
                      fileType: tool.file_type || undefined,
                      promptInstructions: tool.prompt_instructions ?? block.toolConfig?.promptInstructions ?? undefined,
                      instancia: tool.instancia || undefined,
                      fileUrl: tool.file_url || undefined,
                      mensagem: tool.mensagem || undefined,
                    },
                  });
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={activeTools.length ? 'Selecione uma ferramenta' : 'Nenhuma ferramenta ativa'} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {activeTools.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id}>
                      {tool.tool_name} · {tool.tool_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeTools.length === 0 && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Nenhuma ferramenta ativa. Abra o Flow pelo menu do assistente (com tenant) ou adicione <code className="text-[10px] bg-muted px-1 rounded">?tenant_id=SEU_TENANT</code> na URL. Depois crie ferramentas em &quot;Gerenciar Tools&quot;.
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Instruções para a IA
              </Label>
              <Textarea
                value={instructions}
                onChange={(e) =>
                  onUpdate({
                    toolConfig: { ...block.toolConfig, promptInstructions: e.target.value },
                  })
                }
                placeholder="Quando e como a IA deve usar esta ferramenta..."
                className="mt-1.5 min-h-[80px] resize-y"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Salvo em tool_config; o rapid-processor inclui no prompt. Pode sobrescrever o valor da vapi_tools.
              </p>
            </div>

            {selectedTool && (selectedTool.mensagem || selectedTool.file_url) && (
              <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-dashed">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Tipo:</span> {selectedTool.tool_type}
                </div>
                {selectedTool.mensagem && (
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Mensagem / link configurado
                    </Label>
                    <Textarea
                      value={selectedTool.mensagem}
                      readOnly
                      className="mt-1.5 min-h-[60px] opacity-80"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Connection to next block (except for ramificacoes and end blocks)
  const renderNextBlockSelector = () => {
    if (block.type === 'encerrar') return null;
    // For ramificacoes, destinations are handled inline
    if (block.type === 'ramificacoes') return null;

    const otherBlocks = allBlocks.filter(b => b.id !== block.id);
    const hasGoto = !!block.gotoBlockId;
    const gotoBlock = block.gotoBlockId ? allBlocks.find(b => b.id === block.gotoBlockId) : null;
    const gotoBlockInfo = gotoBlock ? getBlockTypeInfo(gotoBlock) : null;

    // Handler for toggling jump on/off
    const handleToggleJump = (checked: boolean) => {
      if (checked) {
        onUpdate({ gotoBlockId: '__pending__' });
      } else {
        onUpdate({ gotoBlockId: null });
      }
    };

    const isJumpEnabled = hasGoto || block.gotoBlockId === '__pending__';

    return (
      <div className="pt-4 mt-4 border-t space-y-4">
        {/* Jump/Goto toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CornerDownRight className="w-4 h-4 text-amber-500" />
            <Label className="text-xs font-semibold uppercase tracking-wide">
              Jump para outro bloco
            </Label>
          </div>
          <Switch
            checked={isJumpEnabled}
            onCheckedChange={handleToggleJump}
          />
        </div>

        {isJumpEnabled && (
          <div className="p-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-lg space-y-2">
            <Label className="text-xs font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              Ir para bloco
            </Label>
            <Select
              value={block.gotoBlockId === '__pending__' ? '' : (block.gotoBlockId || '')}
              onValueChange={(v) => onUpdate({ gotoBlockId: v || null })}
            >
              <SelectTrigger className="bg-background border-amber-500/40 focus:ring-amber-500">
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[300px]">
                {otherBlocks.map(b => {
                  const info = getBlockTypeInfo(b);
                  const globalIndex = allBlocks.findIndex(ab => ab.id === b.id);
                  return (
                    <SelectItem key={b.id} value={b.id} className="flex items-center">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                          style={{ backgroundColor: info.color }}
                        >
                          {globalIndex + 1}
                        </span>
                        <FlowBlockIcon 
                          type={b.type} 
                          toolType={b.toolType} 
                          className="w-3.5 h-3.5" 
                          style={{ color: info.color }}
                        />
                        <span className="truncate max-w-[150px]">
                          {b.content.substring(0, 30)}{b.content.length > 30 ? '...' : ''}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {gotoBlock && gotoBlockInfo && (
              <div className="flex items-center gap-2 p-2 bg-background rounded border text-xs">
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: gotoBlockInfo.bgColor }}
                >
                  <FlowBlockIcon 
                    type={gotoBlock.type} 
                    toolType={gotoBlock.toolType} 
                    className="w-3 h-3" 
                    style={{ color: gotoBlockInfo.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{getBlockLabel(gotoBlock)}</p>
                  <p className="text-muted-foreground truncate text-[10px]">{gotoBlock.content.substring(0, 40)}</p>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-amber-600/80">
              ⚠️ O fluxo irá pular diretamente para este bloco, ignorando a sequência normal.
            </p>
          </div>
        )}

        {!isJumpEnabled && (
          <p className="text-xs text-muted-foreground">
            Por padrão, segue para o próximo bloco na sequência.
          </p>
        )}
      </div>
    );
  };

  // Multi-condicional tem seu próprio layout completo
  if (block.type === 'ramificacoes') {
    return (
      <MultiConditionalProperties
        block={block}
        allBlocks={allBlocks}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <div className="p-4 pt-2 space-y-1 border-t">
      {renderContent()}
      {renderNextBlockSelector()}
    </div>
  );
};
