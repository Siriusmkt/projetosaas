import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, X, Plus } from 'lucide-react';
import { ESTADOS_BRASILEIROS, type PromptInstitucional } from '@/types/prompt';

interface EmpresaSectionProps {
  data: PromptInstitucional | null;
  onSave: (data: Omit<PromptInstitucional, 'id' | 'prompt_id'>) => Promise<void>;
  isSaving: boolean;
}

export function EmpresaSection({ data, onSave, isSaving }: EmpresaSectionProps) {
  const [form, setForm] = useState({
    cidade: data?.cidade || '',
    estado: data?.estado || '',
    pais: data?.pais || 'Brasil',
    area_entrega: data?.area_entrega || '',
    nome_ceo: data?.nome_ceo || '',
    tipo_produto: data?.tipo_produto || '',
    diferenciais: data?.diferenciais || [] as string[],
    sobre_empresa: data?.sobre_empresa || '',
  });
  const [newDiferencial, setNewDiferencial] = useState('');

  useEffect(() => {
    if (data) {
      setForm({
        cidade: data.cidade || '',
        estado: data.estado || '',
        pais: data.pais || 'Brasil',
        area_entrega: data.area_entrega || '',
        nome_ceo: data.nome_ceo || '',
        tipo_produto: data.tipo_produto,
        diferenciais: data.diferenciais || [],
        sobre_empresa: data.sobre_empresa || '',
      });
    }
  }, [data]);

  const handleAddDiferencial = () => {
    if (newDiferencial.trim() && !form.diferenciais.includes(newDiferencial.trim())) {
      setForm(prev => ({
        ...prev,
        diferenciais: [...prev.diferenciais, newDiferencial.trim()],
      }));
      setNewDiferencial('');
    }
  };

  const handleRemoveDiferencial = (index: number) => {
    setForm(prev => ({
      ...prev,
      diferenciais: prev.diferenciais.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form as Omit<PromptInstitucional, 'id' | 'prompt_id'>);
  };

  const isValid = form.tipo_produto.trim() !== '';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Dados da Empresa</h2>
        <p className="text-sm text-muted-foreground">
          Informações que a IA pode mencionar quando perguntada
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              placeholder="Ex: Umuarama"
              value={form.cidade}
              onChange={(e) => setForm(prev => ({ ...prev, cidade: e.target.value }))}
              maxLength={100}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="estado">Estado</Label>
            <Select 
              value={form.estado} 
              onValueChange={(value) => setForm(prev => ({ ...prev, estado: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BRASILEIROS.map(estado => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="area_entrega">Área de Entrega/Atendimento</Label>
          <Textarea
            id="area_entrega"
            placeholder="Ex: Todo o Brasil, exceto região Norte"
            value={form.area_entrega}
            onChange={(e) => setForm(prev => ({ ...prev, area_entrega: e.target.value }))}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Onde a empresa atende/entrega
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nome_ceo">Nome do CEO/Dono (opcional)</Label>
          <Input
            id="nome_ceo"
            placeholder="Ex: João Silva"
            value={form.nome_ceo}
            onChange={(e) => setForm(prev => ({ ...prev, nome_ceo: e.target.value }))}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Só usar se for relevante mencionar
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tipo_produto">O que a empresa vende/faz *</Label>
          <Textarea
            id="tipo_produto"
            placeholder="Ex: Fabricamos equipamentos profissionais de musculação..."
            value={form.tipo_produto}
            onChange={(e) => setForm(prev => ({ ...prev, tipo_produto: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="grid gap-2">
          <Label>Diferenciais Competitivos</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Digite e pressione Enter ou clique em +"
              value={newDiferencial}
              onChange={(e) => setNewDiferencial(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDiferencial();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddDiferencial}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ex: fabricação própria, suporte direto, biomecânica aplicada
          </p>
          
          {form.diferenciais.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.diferenciais.map((dif, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pr-1">
                  {dif}
                  <button
                    type="button"
                    onClick={() => handleRemoveDiferencial(index)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sobre_empresa">Sobre a Empresa (texto livre)</Label>
          <Textarea
            id="sobre_empresa"
            placeholder="Conte mais sobre a história, valores, missão..."
            value={form.sobre_empresa}
            onChange={(e) => setForm(prev => ({ ...prev, sobre_empresa: e.target.value }))}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Informações adicionais que a IA pode usar
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isValid || isSaving}>
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
