import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Agente, 
  AgenteCompleto,
  AgenteIdentidade,
  AgenteEmpresa,
  AgenteRegra,
  AgenteGatilho,
  AgenteFAQ,
  AgenteObjecao,
  AgenteCriterioLead,
  AgenteVozConfig,
  AgentePronuncia,
  AgenteFluxoEtapa,
  AgenteCampoColeta,
  AgenteArgumentoDor,
} from '@/types/agente';
import { DEFAULT_AGENTE_REGRAS } from '@/types/agente';

const QUERY_KEY = 'agentes';

// Fetch all agentes with basic info
async function fetchAgentes(): Promise<Agente[]> {
  const { data, error } = await supabase
    .from('agentes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Agente[];
}

// Fetch single agente with all relations
async function fetchAgenteCompleto(id: string): Promise<AgenteCompleto | null> {
  const { data: agente, error: agenteError } = await supabase
    .from('agentes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (agenteError) throw agenteError;
  if (!agente) return null;

  // Load all relations in parallel
  const [
    identidadeRes,
    empresaRes,
    regrasRes,
    gatilhosRes,
    fluxoRes,
    faqRes,
    objecoesRes,
    criteriosRes,
    coletaRes,
    argumentosRes,
    vozRes,
    pronunciaRes,
  ] = await Promise.all([
    supabase.from('agente_identidade').select('*').eq('agente_id', id).maybeSingle(),
    supabase.from('agente_empresa').select('*').eq('agente_id', id).maybeSingle(),
    supabase.from('agente_regras').select('*').eq('agente_id', id).order('ordem'),
    supabase.from('agente_gatilhos').select('*').eq('agente_id', id).order('ordem'),
    supabase.from('agente_fluxo_etapas').select('*').eq('agente_id', id).order('numero'),
    supabase.from('agente_faq').select('*').eq('agente_id', id).order('ordem'),
    supabase.from('agente_objecoes').select('*').eq('agente_id', id).order('ordem'),
    supabase.from('agente_criterios_lead').select('*').eq('agente_id', id).order('ordem'),
    supabase.from('agente_campos_coleta').select('*').eq('agente_id', id).order('ordem'),
    supabase.from('agente_argumentos_dor').select('*').eq('agente_id', id).order('ordem'),
    supabase.from('agente_voz_config').select('*').eq('agente_id', id).maybeSingle(),
    supabase.from('agente_pronuncia').select('*').eq('agente_id', id),
  ]);

  return {
    agente: agente as Agente,
    identidade: identidadeRes.data as AgenteIdentidade | null,
    empresa: empresaRes.data ? {
      ...empresaRes.data,
      diferenciais: (empresaRes.data.diferenciais as string[]) || [],
    } as AgenteEmpresa : null,
    regras: (regrasRes.data || []) as AgenteRegra[],
    gatilhos: (gatilhosRes.data || []) as AgenteGatilho[],
    fluxo: (fluxoRes.data || []).map(f => ({
      ...f,
      variacoes: (f.variacoes as any[]) || [],
      respostas_condicionais: (f.respostas_condicionais as any[]) || [],
    })) as AgenteFluxoEtapa[],
    faq: (faqRes.data || []).map(f => ({
      ...f,
      palavras_chave: (f.palavras_chave as string[]) || [],
    })) as AgenteFAQ[],
    objecoes: (objecoesRes.data || []) as AgenteObjecao[],
    criterios: (criteriosRes.data || []) as AgenteCriterioLead[],
    coleta: (coletaRes.data || []) as AgenteCampoColeta[],
    argumentos: (argumentosRes.data || []).map(a => ({
      ...a,
      palavras_chave: (a.palavras_chave as string[]) || [],
    })) as AgenteArgumentoDor[],
    voz: vozRes.data ? {
      ...vozRes.data,
      confirmacoes: (vozRes.data.confirmacoes as string[]) || [],
      transicoes: (vozRes.data.transicoes as string[]) || [],
      empatia: (vozRes.data.empatia as string[]) || [],
      concordancia: (vozRes.data.concordancia as string[]) || [],
    } as AgenteVozConfig : null,
    pronuncia: (pronunciaRes.data || []) as AgentePronuncia[],
    scripts: [],
    conectivos: [],
  };
}

// Create new agente
async function createAgente(nome: string): Promise<Agente> {
  const { data: newAgente, error } = await supabase
    .from('agentes')
    .insert({ nome })
    .select()
    .single();

  if (error) throw error;

  // Add default rules
  const regrasToInsert = DEFAULT_AGENTE_REGRAS.map(r => ({
    ...r,
    agente_id: newAgente.id,
  }));

  await supabase.from('agente_regras').insert(regrasToInsert);

  return newAgente as Agente;
}

// Update agente basic info
async function updateAgente(id: string, updates: Partial<Agente>): Promise<void> {
  const { error } = await supabase
    .from('agentes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// Delete agente and all relations
async function deleteAgente(id: string): Promise<void> {
  // Delete all relations first (cascade not automatic)
  await Promise.all([
    supabase.from('agente_identidade').delete().eq('agente_id', id),
    supabase.from('agente_empresa').delete().eq('agente_id', id),
    supabase.from('agente_regras').delete().eq('agente_id', id),
    supabase.from('agente_gatilhos').delete().eq('agente_id', id),
    supabase.from('agente_fluxo_etapas').delete().eq('agente_id', id),
    supabase.from('agente_faq').delete().eq('agente_id', id),
    supabase.from('agente_objecoes').delete().eq('agente_id', id),
    supabase.from('agente_criterios_lead').delete().eq('agente_id', id),
    supabase.from('agente_campos_coleta').delete().eq('agente_id', id),
    supabase.from('agente_argumentos_dor').delete().eq('agente_id', id),
    supabase.from('agente_voz_config').delete().eq('agente_id', id),
    supabase.from('agente_pronuncia').delete().eq('agente_id', id),
  ]);

  const { error } = await supabase
    .from('agentes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Duplicate agente
async function duplicateAgente(id: string): Promise<Agente> {
  const original = await fetchAgenteCompleto(id);
  if (!original) throw new Error('Agente não encontrado');

  // Create new agente
  const { data: newAgente, error } = await supabase
    .from('agentes')
    .insert({ nome: `${original.agente.nome} (cópia)` })
    .select()
    .single();

  if (error) throw error;

  // Duplicate all relations in parallel
  const promises: PromiseLike<any>[] = [];

  if (original.identidade) {
    const { id: _, agente_id: __, ...identData } = original.identidade;
    promises.push(
      supabase.from('agente_identidade').insert({ ...identData, agente_id: newAgente.id })
    );
  }

  if (original.empresa) {
    const { id: _, agente_id: __, ...empData } = original.empresa;
    promises.push(
      supabase.from('agente_empresa').insert({ ...empData, agente_id: newAgente.id })
    );
  }

  if (original.regras.length > 0) {
    const regras = original.regras.map(({ id, agente_id, ...r }) => ({ ...r, agente_id: newAgente.id }));
    promises.push(supabase.from('agente_regras').insert(regras));
  }

  if (original.gatilhos.length > 0) {
    const gatilhos = original.gatilhos.map(({ id, agente_id, ...g }) => ({ ...g, agente_id: newAgente.id }));
    promises.push(supabase.from('agente_gatilhos').insert(gatilhos));
  }

  if (original.faq.length > 0) {
    const faqs = original.faq.map(({ id, agente_id, ...f }) => ({ ...f, agente_id: newAgente.id }));
    promises.push(supabase.from('agente_faq').insert(faqs));
  }

  if (original.objecoes.length > 0) {
    const objecoes = original.objecoes.map(({ id, agente_id, ...o }) => ({ ...o, agente_id: newAgente.id }));
    promises.push(supabase.from('agente_objecoes').insert(objecoes));
  }

  if (original.criterios.length > 0) {
    const criterios = original.criterios.map(({ id, agente_id, ...c }) => ({ ...c, agente_id: newAgente.id }));
    promises.push(supabase.from('agente_criterios_lead').insert(criterios));
  }

  if (original.voz) {
    const { id: _, agente_id: __, ...vozData } = original.voz;
    promises.push(
      supabase.from('agente_voz_config').insert({ ...vozData, agente_id: newAgente.id })
    );
  }

  if (original.pronuncia.length > 0) {
    const pronuncias = original.pronuncia.map(({ id, agente_id, ...p }) => ({ ...p, agente_id: newAgente.id }));
    promises.push(supabase.from('agente_pronuncia').insert(pronuncias));
  }

  await Promise.all(promises);

  return newAgente as Agente;
}

export function useAgentes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // List all agentes
  const {
    data: agentes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchAgentes,
  });

  // Get single agente completo
  const getAgenteCompleto = (id: string) => {
    return useQuery({
      queryKey: [QUERY_KEY, id],
      queryFn: () => fetchAgenteCompleto(id),
      enabled: !!id,
    });
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createAgente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: 'Agente criado com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao criar agente:', error);
      toast({ title: 'Erro ao criar agente', variant: 'destructive' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Agente> }) =>
      updateAgente(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: 'Agente atualizado!' });
    },
    onError: (error) => {
      console.error('Erro ao atualizar agente:', error);
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAgente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: 'Agente excluído!' });
    },
    onError: (error) => {
      console.error('Erro ao excluir agente:', error);
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: duplicateAgente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: 'Agente duplicado com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao duplicar agente:', error);
      toast({ title: 'Erro ao duplicar', variant: 'destructive' });
    },
  });

  return {
    agentes,
    isLoading,
    error,
    refetch,
    getAgenteCompleto,
    create: createMutation.mutateAsync,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    duplicate: duplicateMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
  };
}
