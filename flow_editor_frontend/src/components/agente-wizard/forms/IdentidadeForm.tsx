import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AgenteIdentidade } from '@/types/agente';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IdentidadeFormProps {
  data: Partial<AgenteIdentidade>;
  onChange: (data: Partial<AgenteIdentidade>) => void;
}

export function IdentidadeForm({ data, onChange }: IdentidadeFormProps) {
  const update = (field: keyof AgenteIdentidade, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nome da IA *</Label>
          <Input
            value={data.nome_ia || ''}
            onChange={(e) => update('nome_ia', e.target.value)}
            placeholder="Ex: Isabela, Ana, Sofia"
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Nome que será usado nas conversas
          </p>
        </div>

        <div>
          <Label>Gênero *</Label>
          <Select
            value={data.genero || ''}
            onValueChange={(v) => update('genero', v)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feminino">Feminino</SelectItem>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="neutro">Neutro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nome da Empresa *</Label>
          <Input
            value={data.empresa_nome || ''}
            onChange={(e) => update('empresa_nome', e.target.value)}
            placeholder="Ex: Romano Academia"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Nome Curto (opcional)</Label>
          <Input
            value={data.empresa_nome_curto || ''}
            onChange={(e) => update('empresa_nome_curto', e.target.value)}
            placeholder="Ex: Romano"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Função *</Label>
          <Select
            value={data.funcao || ''}
            onValueChange={(v) => update('funcao', v)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sdr">SDR (Pré-vendas)</SelectItem>
              <SelectItem value="atendimento">Atendimento</SelectItem>
              <SelectItem value="suporte">Suporte</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Setor *</Label>
          <Input
            value={data.setor || ''}
            onChange={(e) => update('setor', e.target.value)}
            placeholder="Ex: Equipamentos para academias"
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label>Personalidade (opcional)</Label>
        <Textarea
          value={data.personalidade || ''}
          onChange={(e) => update('personalidade', e.target.value)}
          placeholder="Descreva a personalidade e tom de voz do agente..."
          className="mt-1.5 min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ex: Simpática, profissional, consultiva, empática
        </p>
      </div>
    </div>
  );
}