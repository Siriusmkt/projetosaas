import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Plus, Trash2, Target, Info } from 'lucide-react';
import type { PromptDiferencialPorDor } from '@/types/prompt';

interface DiferenciaisSectionProps {
  data: PromptDiferencialPorDor[];
  onSave: (data: Omit<PromptDiferencialPorDor, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

const DEFAULT_DIFERENCIAIS: Omit<PromptDiferencialPorDor, 'id' | 'prompt_id'>[] = [
  {
    dor_mencionada: 'Durabilidade',
    argumento: 'Sobre durabilidade, somos fabricante próprio focado em uso comercial intenso. A estrutura é reforçada pensando em academia com alto fluxo. Não é equipamento residencial adaptado.',
    ordem: 0,
  },
  {
    dor_mencionada: 'Manutenção',
    argumento: 'Sobre manutenção, como somos fabricante, você tem suporte direto conosco. Não precisa depender de terceiros. Qualquer coisa, é direto com quem produziu.',
    ordem: 1,
  },
  {
    dor_mencionada: 'Conforto / Biomecânica',
    argumento: 'Trabalhamos com biomecânica aplicada nos ajustes. Não é só equipamento bonito, é equipamento que funciona de verdade pro usuário treinar com conforto e segurança.',
    ordem: 2,
  },
];

export function DiferenciaisSection({ data, onSave, isSaving }: DiferenciaisSectionProps) {
  const [diferenciais, setDiferenciais] = useState<Omit<PromptDiferencialPorDor, 'id' | 'prompt_id'>[]>([]);

  useEffect(() => {
    if (data.length > 0) {
      setDiferenciais(data.map(d => ({
        dor_mencionada: d.dor_mencionada,
        argumento: d.argumento,
        ordem: d.ordem,
      })));
    } else {
      setDiferenciais(DEFAULT_DIFERENCIAIS);
    }
  }, [data]);

  const handleUpdate = (index: number, field: 'dor_mencionada' | 'argumento', value: string) => {
    setDiferenciais(prev => prev.map((d, i) => 
      i === index ? { ...d, [field]: value } : d
    ));
  };

  const handleAdd = () => {
    setDiferenciais(prev => [...prev, {
      dor_mencionada: '',
      argumento: '',
      ordem: prev.length,
    }]);
  };

  const handleRemove = (index: number) => {
    setDiferenciais(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(diferenciais.filter(d => d.dor_mencionada && d.argumento));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Argumentos por Dor</h2>
        <p className="text-sm text-muted-foreground">
          Respostas específicas baseadas na preocupação do cliente
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Quando o cliente mencionar uma dor específica, a IA usa o argumento correspondente 
          para mostrar como você resolve esse problema.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {diferenciais.map((diferencial, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-2" />
              <div className="flex-1 space-y-3">
                <Input
                  value={diferencial.dor_mencionada}
                  onChange={(e) => handleUpdate(index, 'dor_mencionada', e.target.value)}
                  placeholder="Dor do cliente (ex: Durabilidade, Manutenção, Preço)"
                  className="font-medium"
                />
                
                <Textarea
                  value={diferencial.argumento}
                  onChange={(e) => handleUpdate(index, 'argumento', e.target.value)}
                  placeholder="Argumento que mostra como você resolve essa dor..."
                  rows={3}
                />
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Argumento por Dor
      </Button>

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
