import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import type { PromptTom } from '@/types/prompt';

interface TomSectionProps {
  data: PromptTom | null;
  onSave: (data: Omit<PromptTom, 'id' | 'prompt_id'>) => Promise<void>;
  isSaving: boolean;
}

export function TomSection({ data, onSave, isSaving }: TomSectionProps) {
  const [form, setForm] = useState({
    usa_girias: data?.usa_girias ?? true,
    usa_emojis: data?.usa_emojis ?? false,
    nivel_formalidade: data?.nivel_formalidade || 'informal',
    proporcao_fala_escuta: data?.proporcao_fala_escuta || '20/80',
    posicionamento: data?.posicionamento || 'consultivo',
    instrucoes_adicionais: data?.instrucoes_adicionais || '',
  });

  const [formalidadeValue, setFormalidadeValue] = useState(
    data?.nivel_formalidade === 'formal' ? 100 : 
    data?.nivel_formalidade === 'semi-formal' ? 50 : 25
  );
  
  const [proporcaoValue, setProporcaoValue] = useState(
    parseInt(data?.proporcao_fala_escuta?.split('/')[0] || '20')
  );

  useEffect(() => {
    if (data) {
      setForm({
        usa_girias: data.usa_girias,
        usa_emojis: data.usa_emojis,
        nivel_formalidade: data.nivel_formalidade,
        proporcao_fala_escuta: data.proporcao_fala_escuta,
        posicionamento: data.posicionamento,
        instrucoes_adicionais: data.instrucoes_adicionais || '',
      });
      setFormalidadeValue(
        data.nivel_formalidade === 'formal' ? 100 : 
        data.nivel_formalidade === 'semi-formal' ? 50 : 25
      );
      setProporcaoValue(parseInt(data.proporcao_fala_escuta?.split('/')[0] || '20'));
    }
  }, [data]);

  const handleFormalidadeChange = (value: number[]) => {
    const v = value[0];
    setFormalidadeValue(v);
    let nivel: 'formal' | 'semi-formal' | 'informal' = 'informal';
    if (v >= 75) nivel = 'formal';
    else if (v >= 40) nivel = 'semi-formal';
    setForm(prev => ({ ...prev, nivel_formalidade: nivel }));
  };

  const handleProporcaoChange = (value: number[]) => {
    const v = value[0];
    setProporcaoValue(v);
    setForm(prev => ({ ...prev, proporcao_fala_escuta: `${v}/${100 - v}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form as Omit<PromptTom, 'id' | 'prompt_id'>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Tom e Personalidade</h2>
        <p className="text-sm text-muted-foreground">
          Como a IA se comunica
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Label>Nível de Formalidade</Label>
          <Slider
            value={[formalidadeValue]}
            onValueChange={handleFormalidadeChange}
            min={0}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Muito Informal</span>
            <span>Equilibrado</span>
            <span>Muito Formal</span>
          </div>
          <p className="text-xs text-muted-foreground">
            0 = gírias e linguagem coloquial | 100 = linguagem corporativa formal
          </p>
        </div>

        <div className="space-y-4">
          <Label>Proporção Fala vs Escuta</Label>
          <Slider
            value={[proporcaoValue]}
            onValueChange={handleProporcaoChange}
            min={10}
            max={80}
            step={5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{proporcaoValue}% fala</span>
            <span>{100 - proporcaoValue}% escuta</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Quanto menor, mais a IA escuta e faz perguntas
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label>Usar gírias leves</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Ex: "Show!", "Bacana!", "Tá ligado?"
              </p>
            </div>
            <Switch
              checked={form.usa_girias}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, usa_girias: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label>Usar emojis</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Adiciona emojis nas mensagens
              </p>
            </div>
            <Switch
              checked={form.usa_emojis}
              onCheckedChange={(checked) => setForm(prev => ({ ...prev, usa_emojis: checked }))}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Posicionamento</Label>
          <Select 
            value={form.posicionamento} 
            onValueChange={(value) => setForm(prev => ({ 
              ...prev, 
              posicionamento: value as 'consultivo' | 'vendedor' | 'suporte' | 'receptivo' 
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultivo">Consultivo (orienta sem vender)</SelectItem>
              <SelectItem value="vendedor">Vendedor (foco em conversão)</SelectItem>
              <SelectItem value="suporte">Suporte (foco em resolver problemas)</SelectItem>
              <SelectItem value="receptivo">Receptivo (apenas qualifica)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Define como a IA se posiciona na conversa
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="instrucoes">Instruções Adicionais de Tom</Label>
          <Textarea
            id="instrucoes"
            placeholder="Adicione instruções específicas sobre como a IA deve se comunicar..."
            value={form.instrucoes_adicionais}
            onChange={(e) => setForm(prev => ({ ...prev, instrucoes_adicionais: e.target.value }))}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Ex: "Nunca use a palavra problema, use desafio"
          </p>
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
