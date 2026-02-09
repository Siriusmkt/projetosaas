import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import type { PromptIdentidade } from '@/types/prompt';

interface IdentidadeSectionProps {
  data: PromptIdentidade | null;
  onSave: (data: Omit<PromptIdentidade, 'id' | 'prompt_id'>) => Promise<void>;
  isSaving: boolean;
}

export function IdentidadeSection({ data, onSave, isSaving }: IdentidadeSectionProps) {
  const [form, setForm] = useState({
    nome_ia: data?.nome_ia || '',
    genero: data?.genero || 'feminino',
    empresa_nome: data?.empresa_nome || '',
    empresa_nome_curto: data?.empresa_nome_curto || '',
    funcao: data?.funcao || '',
    setor: data?.setor || '',
    personalidade: data?.personalidade || '',
  });

  useEffect(() => {
    if (data) {
      setForm({
        nome_ia: data.nome_ia,
        genero: data.genero,
        empresa_nome: data.empresa_nome,
        empresa_nome_curto: data.empresa_nome_curto || '',
        funcao: data.funcao,
        setor: data.setor,
        personalidade: data.personalidade || '',
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form as Omit<PromptIdentidade, 'id' | 'prompt_id'>);
  };

  const isValid = form.nome_ia && form.empresa_nome && form.funcao && form.setor;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Identidade da IA</h2>
        <p className="text-sm text-muted-foreground">
          Defina quem é sua assistente virtual
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nome_ia">Nome da IA *</Label>
          <Input
            id="nome_ia"
            placeholder="Ex: Isabela, Carlos, Luna"
            value={form.nome_ia}
            onChange={(e) => setForm(prev => ({ ...prev, nome_ia: e.target.value }))}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Nome pelo qual a IA vai se apresentar
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="genero">Gênero</Label>
          <Select 
            value={form.genero} 
            onValueChange={(value) => setForm(prev => ({ ...prev, genero: value as 'feminino' | 'masculino' | 'neutro' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feminino">Feminino (ela/dela)</SelectItem>
              <SelectItem value="masculino">Masculino (ele/dele)</SelectItem>
              <SelectItem value="neutro">Neutro</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Define pronomes e concordância
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="empresa_nome">Nome da Empresa *</Label>
          <Input
            id="empresa_nome"
            placeholder="Ex: Romano Equipamentos para Ginástica LTDA"
            value={form.empresa_nome}
            onChange={(e) => setForm(prev => ({ ...prev, empresa_nome: e.target.value }))}
            maxLength={200}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="empresa_nome_curto">Nome Curto da Empresa</Label>
          <Input
            id="empresa_nome_curto"
            placeholder="Ex: Romano"
            value={form.empresa_nome_curto}
            onChange={(e) => setForm(prev => ({ ...prev, empresa_nome_curto: e.target.value }))}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            Versão abreviada para usar na conversa
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="funcao">Função/Cargo *</Label>
          <Input
            id="funcao"
            placeholder="Ex: assistente virtual de pré-vendas"
            value={form.funcao}
            onChange={(e) => setForm(prev => ({ ...prev, funcao: e.target.value }))}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            O que a IA faz na empresa
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="setor">Setor de Atuação *</Label>
          <Input
            id="setor"
            placeholder="Ex: equipamentos de academia"
            value={form.setor}
            onChange={(e) => setForm(prev => ({ ...prev, setor: e.target.value }))}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Nicho/mercado da empresa
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="personalidade">Personalidade (opcional)</Label>
          <Textarea
            id="personalidade"
            placeholder="Descreva como a IA deve se comportar..."
            value={form.personalidade}
            onChange={(e) => setForm(prev => ({ ...prev, personalidade: e.target.value }))}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Ex: simpática, objetiva, usa linguagem informal
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
