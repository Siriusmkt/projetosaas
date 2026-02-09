import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Plus, Trash2, Volume2, Info } from 'lucide-react';
import type { PromptPronuncia } from '@/types/prompt';

interface PronunciaSectionProps {
  data: PromptPronuncia[];
  onSave: (data: Omit<PromptPronuncia, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

const DEFAULT_PRONUNCIA: Omit<PromptPronuncia, 'id' | 'prompt_id'>[] = [
  { simbolo: '%', pronuncia: 'por cento' },
  { simbolo: 'R$', pronuncia: 'reais' },
  { simbolo: 'kg', pronuncia: 'quilos' },
  { simbolo: 'm²', pronuncia: 'metros quadrados' },
  { simbolo: '@', pronuncia: 'arroba' },
  { simbolo: 'cm', pronuncia: 'centímetros' },
  { simbolo: 'km', pronuncia: 'quilômetros' },
  { simbolo: 'h', pronuncia: 'horas' },
  { simbolo: 'min', pronuncia: 'minutos' },
];

export function PronunciaSection({ data, onSave, isSaving }: PronunciaSectionProps) {
  const [pronuncias, setPronuncias] = useState<Omit<PromptPronuncia, 'id' | 'prompt_id'>[]>([]);
  const [newItem, setNewItem] = useState({ simbolo: '', pronuncia: '' });

  useEffect(() => {
    if (data.length > 0) {
      setPronuncias(data.map(p => ({
        simbolo: p.simbolo,
        pronuncia: p.pronuncia,
      })));
    } else {
      setPronuncias(DEFAULT_PRONUNCIA);
    }
  }, [data]);

  const handleUpdate = (index: number, field: 'simbolo' | 'pronuncia', value: string) => {
    setPronuncias(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const handleAdd = () => {
    if (!newItem.simbolo.trim() || !newItem.pronuncia.trim()) return;
    
    setPronuncias(prev => [...prev, {
      simbolo: newItem.simbolo.trim(),
      pronuncia: newItem.pronuncia.trim(),
    }]);
    setNewItem({ simbolo: '', pronuncia: '' });
  };

  const handleRemove = (index: number) => {
    setPronuncias(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(pronuncias.filter(p => p.simbolo && p.pronuncia));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Pronúncia (IA de Voz)</h2>
        <p className="text-sm text-muted-foreground">
          Como a IA de voz deve pronunciar símbolos e abreviações
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta seção é específica para <strong>IAs de voz</strong>. Define como símbolos 
          e números devem ser falados para uma pronúncia natural.
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 p-3 bg-muted/50 border-b font-medium text-sm">
          <div>Símbolo / Abreviação</div>
          <div>Pronúncia</div>
          <div className="w-10"></div>
        </div>
        
        <div className="divide-y">
          {pronuncias.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-4 p-3 items-center group">
              <Input
                value={item.simbolo}
                onChange={(e) => handleUpdate(index, 'simbolo', e.target.value)}
                placeholder="Ex: %"
                className="font-mono"
              />
              <Input
                value={item.pronuncia}
                onChange={(e) => handleUpdate(index, 'pronuncia', e.target.value)}
                placeholder="Ex: por cento"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-sm">Adicionar Pronúncia</h4>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <Input
            placeholder="Símbolo (ex: R$, %, kg)"
            value={newItem.simbolo}
            onChange={(e) => setNewItem(prev => ({ ...prev, simbolo: e.target.value }))}
            className="font-mono"
          />
          <Input
            placeholder="Pronúncia (ex: reais, por cento, quilos)"
            value={newItem.pronuncia}
            onChange={(e) => setNewItem(prev => ({ ...prev, pronuncia: e.target.value }))}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!newItem.simbolo.trim() || !newItem.pronuncia.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Volume2 className="w-5 h-5 text-primary mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium">Regra de Números</h4>
            <p className="text-sm text-muted-foreground">
              Lembre-se: Nas <strong>Regras e Limites</strong>, você pode ativar a regra 
              "Números sempre por extenso" para que a IA converta automaticamente 
              números em texto (ex: "30 minutos" → "trinta minutos").
            </p>
          </div>
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
