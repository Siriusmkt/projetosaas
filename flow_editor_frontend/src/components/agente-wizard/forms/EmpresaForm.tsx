import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { AgenteEmpresa, ESTADOS_BRASILEIROS } from '@/types/agente';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EmpresaFormProps {
  data: Partial<AgenteEmpresa>;
  onChange: (data: Partial<AgenteEmpresa>) => void;
}

export function EmpresaForm({ data, onChange }: EmpresaFormProps) {
  const [novoD, setNovoD] = useState('');
  
  const update = (field: keyof AgenteEmpresa, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addDiferencial = () => {
    if (!novoD.trim()) return;
    const atuais = data.diferenciais || [];
    update('diferenciais', [...atuais, novoD.trim()]);
    setNovoD('');
  };

  const removeDiferencial = (idx: number) => {
    const atuais = data.diferenciais || [];
    update('diferenciais', atuais.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>O que a empresa vende? *</Label>
        <Textarea
          value={data.tipo_produto || ''}
          onChange={(e) => update('tipo_produto', e.target.value)}
          placeholder="Ex: Equipamentos para academias de musculação, crossfit e funcional"
          className="mt-1.5"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Cidade</Label>
          <Input
            value={data.cidade || ''}
            onChange={(e) => update('cidade', e.target.value)}
            placeholder="São Paulo"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Estado</Label>
          <Select
            value={data.estado || ''}
            onValueChange={(v) => update('estado', v)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_BRASILEIROS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>País</Label>
          <Input
            value={data.pais || 'Brasil'}
            onChange={(e) => update('pais', e.target.value)}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Setor de Atuação</Label>
          <Input
            value={data.setor || ''}
            onChange={(e) => update('setor', e.target.value)}
            placeholder="Fitness, Saúde, Varejo..."
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Área de Entrega</Label>
          <Input
            value={data.area_entrega || ''}
            onChange={(e) => update('area_entrega', e.target.value)}
            placeholder="Todo Brasil, SP e RJ..."
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label>Diferenciais da Empresa *</Label>
        <div className="flex flex-wrap gap-2 mt-2 min-h-[40px]">
          {(data.diferenciais || []).map((d, i) => (
            <Badge key={i} variant="secondary" className="gap-1 py-1">
              {d}
              <button onClick={() => removeDiferencial(i)} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={novoD}
            onChange={(e) => setNovoD(e.target.value)}
            placeholder="Ex: 25 anos de mercado, Garantia de 2 anos..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDiferencial())}
          />
          <Button type="button" variant="secondary" onClick={addDiferencial} disabled={!novoD.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Adicione pelo menos 1 diferencial
        </p>
      </div>

      <div>
        <Label>Sobre a Empresa (opcional)</Label>
        <Textarea
          value={data.sobre_empresa || ''}
          onChange={(e) => update('sobre_empresa', e.target.value)}
          placeholder="Breve descrição da história e valores da empresa..."
          className="mt-1.5 min-h-[80px]"
        />
      </div>
    </div>
  );
}