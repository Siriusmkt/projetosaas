import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Plus, Trash2, GripVertical, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptCampoColeta } from '@/types/prompt';

interface ColetaSectionProps {
  data: PromptCampoColeta[];
  onSave: (data: Omit<PromptCampoColeta, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

const DEFAULT_CAMPOS: Omit<PromptCampoColeta, 'id' | 'prompt_id'>[] = [
  { campo_nome: 'Nome', is_obrigatorio: true, ordem: 0 },
  { campo_nome: 'Tipo de projeto', campo_descricao: 'Montagem, renovação ou ampliação', is_obrigatorio: true, ordem: 1 },
  { campo_nome: 'Público-alvo da academia', campo_descricao: 'Quem frequenta ou vai frequentar', is_obrigatorio: true, ordem: 2 },
  { campo_nome: 'Intensidade de uso esperada', campo_descricao: 'Volume de uso dos equipamentos', is_obrigatorio: false, ordem: 3 },
  { campo_nome: 'Espaço físico', campo_descricao: 'Se já tem local definido ou não', is_obrigatorio: false, ordem: 4 },
  { campo_nome: 'Principais dores/preocupações', campo_descricao: 'O que mais preocupa o cliente', is_obrigatorio: true, ordem: 5 },
  { campo_nome: 'Poder de decisão', campo_descricao: 'Se é decisor ou influenciador', is_obrigatorio: true, ordem: 6 },
  { campo_nome: 'Urgência/prazo', campo_descricao: 'Se tem data limite', is_obrigatorio: false, ordem: 7 },
  { campo_nome: 'Disponibilidade para reunião', campo_descricao: 'Se aceita conversa com time técnico', is_obrigatorio: false, ordem: 8 },
];

export function ColetaSection({ data, onSave, isSaving }: ColetaSectionProps) {
  const [campos, setCampos] = useState<Omit<PromptCampoColeta, 'id' | 'prompt_id'>[]>([]);
  const [newCampo, setNewCampo] = useState({ nome: '', descricao: '', obrigatorio: false });

  useEffect(() => {
    if (data.length > 0) {
      setCampos(data.map(c => ({
        campo_nome: c.campo_nome,
        campo_descricao: c.campo_descricao,
        is_obrigatorio: c.is_obrigatorio,
        ordem: c.ordem,
      })));
    } else {
      setCampos(DEFAULT_CAMPOS);
    }
  }, [data]);

  const handleToggleObrigatorio = (index: number) => {
    setCampos(prev => prev.map((c, i) => 
      i === index ? { ...c, is_obrigatorio: !c.is_obrigatorio } : c
    ));
  };

  const handleUpdate = (index: number, field: 'campo_nome' | 'campo_descricao', value: string) => {
    setCampos(prev => prev.map((c, i) => 
      i === index ? { ...c, [field]: value } : c
    ));
  };

  const handleAdd = () => {
    if (!newCampo.nome.trim()) return;
    
    setCampos(prev => [...prev, {
      campo_nome: newCampo.nome.trim(),
      campo_descricao: newCampo.descricao.trim() || undefined,
      is_obrigatorio: newCampo.obrigatorio,
      ordem: prev.length,
    }]);
    setNewCampo({ nome: '', descricao: '', obrigatorio: false });
  };

  const handleRemove = (index: number) => {
    setCampos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(campos.filter(c => c.campo_nome));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Campos a Coletar</h2>
        <p className="text-sm text-muted-foreground">
          Informações que a IA deve capturar durante a conversa
        </p>
      </div>

      <div className="space-y-2">
        {campos.map((campo, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 p-3 border rounded-lg group",
              campo.is_obrigatorio && "bg-primary/5 border-primary/20"
            )}
          >
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            
            <div className="flex-1 flex items-center gap-3">
              <Input
                value={campo.campo_nome}
                onChange={(e) => handleUpdate(index, 'campo_nome', e.target.value)}
                placeholder="Nome do campo"
                className="flex-1 font-medium"
              />
              <Input
                value={campo.campo_descricao || ''}
                onChange={(e) => handleUpdate(index, 'campo_descricao', e.target.value)}
                placeholder="Descrição (opcional)"
                className="flex-1 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={campo.is_obrigatorio}
                  onCheckedChange={() => handleToggleObrigatorio(index)}
                />
                <span className="text-muted-foreground">Obrigatório</span>
              </label>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-sm">Adicionar Campo</h4>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              placeholder="Nome do campo"
              value={newCampo.nome}
              onChange={(e) => setNewCampo(prev => ({ ...prev, nome: e.target.value }))}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Descrição (opcional)"
              value={newCampo.descricao}
              onChange={(e) => setNewCampo(prev => ({ ...prev, descricao: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
            <Checkbox
              checked={newCampo.obrigatorio}
              onCheckedChange={(checked) => setNewCampo(prev => ({ ...prev, obrigatorio: !!checked }))}
            />
            Obrigatório
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!newCampo.nome.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar e Continuar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
