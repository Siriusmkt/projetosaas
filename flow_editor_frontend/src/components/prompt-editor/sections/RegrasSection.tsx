import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Plus, Trash2, Shield, Info, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_RULES, type PromptRegra } from '@/types/prompt';

interface RegrasSectionProps {
  data: PromptRegra[];
  onSave: (data: Omit<PromptRegra, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

export function RegrasSection({ data, onSave, isSaving }: RegrasSectionProps) {
  const [regras, setRegras] = useState<Omit<PromptRegra, 'id' | 'prompt_id'>[]>(
    data.length > 0 ? data.map(r => ({
      regra_key: r.regra_key,
      regra_nome: r.regra_nome,
      regra_descricao: r.regra_descricao,
      is_active: r.is_active,
      ordem: r.ordem,
    })) : DEFAULT_RULES
  );
  
  const [newRegra, setNewRegra] = useState({ nome: '', descricao: '' });

  useEffect(() => {
    if (data.length > 0) {
      setRegras(data.map(r => ({
        regra_key: r.regra_key,
        regra_nome: r.regra_nome,
        regra_descricao: r.regra_descricao,
        is_active: r.is_active,
        ordem: r.ordem,
      })));
    }
  }, [data]);

  const handleToggle = (key: string) => {
    setRegras(prev => prev.map(r => 
      r.regra_key === key ? { ...r, is_active: !r.is_active } : r
    ));
  };

  const handleAddRegra = () => {
    if (newRegra.nome.trim()) {
      const key = `custom_${Date.now()}`;
      setRegras(prev => [...prev, {
        regra_key: key,
        regra_nome: newRegra.nome.trim(),
        regra_descricao: newRegra.descricao.trim() || undefined,
        is_active: true,
        ordem: prev.length,
      }]);
      setNewRegra({ nome: '', descricao: '' });
    }
  };

  const handleRemoveRegra = (key: string) => {
    setRegras(prev => prev.filter(r => r.regra_key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(regras);
  };

  const isDefaultRule = (key: string) => DEFAULT_RULES.some(r => r.regra_key === key);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Regras e Limites</h2>
        <p className="text-sm text-muted-foreground">
          O que a IA NÃO pode fazer
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Estas regras são críticas para o funcionamento correto da IA. 
          Desative apenas se tiver certeza.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {regras.map((regra) => {
          const isDefault = isDefaultRule(regra.regra_key);
          
          return (
            <div
              key={regra.regra_key}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-all",
                regra.is_active ? "bg-card" : "bg-muted/30 opacity-60"
              )}
            >
              <Switch
                checked={regra.is_active}
                onCheckedChange={() => handleToggle(regra.regra_key)}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    "font-medium",
                    !regra.is_active && "line-through"
                  )}>
                    {regra.regra_nome}
                  </h4>
                  {isDefault && (
                    <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      <Star className="w-3 h-3" />
                      Recomendada
                    </span>
                  )}
                </div>
                {regra.regra_descricao && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {regra.regra_descricao}
                  </p>
                )}
              </div>
              
              {!isDefault && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveRegra(regra.regra_key)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Adicionar Regra Personalizada</h4>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Nome da regra"
              value={newRegra.nome}
              onChange={(e) => setNewRegra(prev => ({ ...prev, nome: e.target.value }))}
            />
          </div>
          <div className="flex-[2]">
            <Input
              placeholder="Descrição do que não pode fazer"
              value={newRegra.descricao}
              onChange={(e) => setNewRegra(prev => ({ ...prev, descricao: e.target.value }))}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRegra}
            disabled={!newRegra.nome.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
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
