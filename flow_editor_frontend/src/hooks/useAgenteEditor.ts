import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  AgenteCompleto, 
  AgenteSection,
  AgenteIdentidade,
  AgenteEmpresa,
  AgenteRegra,
  AgenteGatilho,
  AgenteFluxoEtapa,
  AgenteFAQ,
  AgenteObjecao,
  AgenteCriterioLead,
  AgenteCampoColeta,
  AgenteArgumentoDor,
  AgenteVozConfig,
  AgentePronuncia,
  Agente,
  AgenteValidation,
} from '@/types/agente';
import { DEFAULT_AGENTE_REGRAS, validateAgente } from '@/types/agente';

const EMPTY_AGENTE: AgenteCompleto = {
  agente: {
    id: '',
    nome: 'Novo Agente',
    status: 'rascunho',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  identidade: null,
  empresa: null,
  regras: [],
  gatilhos: [],
  fluxo: [],
  faq: [],
  objecoes: [],
  criterios: [],
  coleta: [],
  argumentos: [],
  voz: null,
  pronuncia: [],
  scripts: [],
  conectivos: [],
};

export function useAgenteEditor(agenteId?: string) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState<AgenteSection>('identidade');
  const [data, setData] = useState<AgenteCompleto>(EMPTY_AGENTE);
  const [validation, setValidation] = useState<AgenteValidation>({
    isValid: false,
    completedSections: [],
    missingSections: ['identidade', 'empresa', 'regras', 'gatilhos', 'respostas', 'qualificacao', 'voz'],
    errors: [],
    progress: 0,
  });

  // Update validation when data changes
  useEffect(() => {
    setValidation(validateAgente(data));
  }, [data]);

  // Load existing agente
  const loadAgente = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { data: agente, error: agenteError } = await supabase
        .from('agentes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (agenteError) throw agenteError;
      if (!agente) {
        toast({ title: 'Agente não encontrado', variant: 'destructive' });
        return;
      }

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

      setData({
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
      });
    } catch (error) {
      console.error('Erro ao carregar agente:', error);
      toast({ title: 'Erro ao carregar agente', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create new agente
  const createAgente = useCallback(async (nome: string): Promise<string | null> => {
    setIsSaving(true);
    try {
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

      setData(prev => ({
        ...prev,
        agente: newAgente as Agente,
        regras: regrasToInsert.map((r, i) => ({ ...r, id: `temp-${i}` })) as AgenteRegra[],
      }));

      toast({ title: 'Agente criado com sucesso!' });
      return newAgente.id;
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      toast({ title: 'Erro ao criar agente', variant: 'destructive' });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Generic upsert helper
  const upsertSingle = useCallback(async (
    table: 'agente_identidade' | 'agente_empresa' | 'agente_voz_config',
    payload: Record<string, any>,
    successMessage: string
  ) => {
    if (!data.agente.id) return;
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq('agente_id', data.agente.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from(table)
          .update(payload)
          .eq('agente_id', data.agente.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert({ ...payload, agente_id: data.agente.id });
        if (error) throw error;
      }

      toast({ title: successMessage });
      return true;
    } catch (error) {
      console.error(`Erro ao salvar ${table}:`, error);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data.agente.id, toast]);

  // Generic replace helper for arrays
  type ArrayTable = 'agente_regras' | 'agente_gatilhos' | 'agente_fluxo_etapas' | 'agente_faq' | 'agente_objecoes' | 'agente_criterios_lead' | 'agente_campos_coleta' | 'agente_argumentos_dor' | 'agente_pronuncia';
  
  const replaceMany = useCallback(async (
    table: ArrayTable,
    items: Record<string, any>[],
    successMessage: string
  ) => {
    if (!data.agente.id) return;
    setIsSaving(true);
    try {
      await supabase.from(table).delete().eq('agente_id', data.agente.id);
      
      if (items.length > 0) {
        const { error } = await supabase
          .from(table)
          .insert(items.map(item => ({ ...item, agente_id: data.agente.id })) as any);
        if (error) throw error;
      }

      toast({ title: successMessage });
      return true;
    } catch (error) {
      console.error(`Erro ao salvar ${table}:`, error);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data.agente.id, toast]);

  // Save identidade
  const saveIdentidade = useCallback(async (identidade: Omit<AgenteIdentidade, 'id' | 'agente_id'>) => {
    const success = await upsertSingle('agente_identidade', identidade, 'Identidade salva!');
    if (success) {
      setData(prev => ({
        ...prev,
        identidade: { ...identidade, id: prev.identidade?.id || '', agente_id: data.agente.id } as AgenteIdentidade,
      }));
    }
  }, [upsertSingle, data.agente.id]);

  // Save empresa
  const saveEmpresa = useCallback(async (empresa: Omit<AgenteEmpresa, 'id' | 'agente_id'>) => {
    const success = await upsertSingle('agente_empresa', empresa, 'Dados da empresa salvos!');
    if (success) {
      setData(prev => ({
        ...prev,
        empresa: { ...empresa, id: prev.empresa?.id || '', agente_id: data.agente.id } as AgenteEmpresa,
      }));
    }
  }, [upsertSingle, data.agente.id]);

  // Save regras
  const saveRegras = useCallback(async (regras: Omit<AgenteRegra, 'id' | 'agente_id'>[]) => {
    const success = await replaceMany('agente_regras', regras, 'Regras salvas!');
    if (success) {
      const { data: updated } = await supabase
        .from('agente_regras')
        .select('*')
        .eq('agente_id', data.agente.id)
        .order('ordem');
      setData(prev => ({ ...prev, regras: (updated || []) as AgenteRegra[] }));
    }
  }, [replaceMany, data.agente.id]);

  // Save gatilhos
  const saveGatilhos = useCallback(async (gatilhos: Omit<AgenteGatilho, 'id' | 'agente_id'>[]) => {
    const success = await replaceMany('agente_gatilhos', gatilhos, 'Gatilhos salvos!');
    if (success) {
      const { data: updated } = await supabase
        .from('agente_gatilhos')
        .select('*')
        .eq('agente_id', data.agente.id)
        .order('ordem');
      setData(prev => ({ ...prev, gatilhos: (updated || []) as AgenteGatilho[] }));
    }
  }, [replaceMany, data.agente.id]);

  // Save fluxo
  const saveFluxo = useCallback(async (fluxo: Omit<AgenteFluxoEtapa, 'id' | 'agente_id'>[]) => {
    const success = await replaceMany('agente_fluxo_etapas', fluxo, 'Fluxo salvo!');
    if (success) {
      const { data: updated } = await supabase
        .from('agente_fluxo_etapas')
        .select('*')
        .eq('agente_id', data.agente.id)
        .order('numero');
      setData(prev => ({ 
        ...prev, 
        fluxo: (updated || []).map(f => ({
          ...f,
          variacoes: (f.variacoes as any[]) || [],
          respostas_condicionais: (f.respostas_condicionais as any[]) || [],
        })) as AgenteFluxoEtapa[]
      }));
    }
  }, [replaceMany, data.agente.id]);

  // Save FAQ
  const saveFAQ = useCallback(async (faq: Omit<AgenteFAQ, 'id' | 'agente_id'>[]) => {
    const success = await replaceMany('agente_faq', faq, 'FAQ salvo!');
    if (success) {
      const { data: updated } = await supabase
        .from('agente_faq')
        .select('*')
        .eq('agente_id', data.agente.id)
        .order('ordem');
      setData(prev => ({ 
        ...prev, 
        faq: (updated || []).map(f => ({
          ...f,
          palavras_chave: (f.palavras_chave as string[]) || [],
        })) as AgenteFAQ[]
      }));
    }
  }, [replaceMany, data.agente.id]);

  // Save objeções
  const saveObjecoes = useCallback(async (objecoes: Omit<AgenteObjecao, 'id' | 'agente_id'>[]) => {
    const success = await replaceMany('agente_objecoes', objecoes, 'Objeções salvas!');
    if (success) {
      const { data: updated } = await supabase
        .from('agente_objecoes')
        .select('*')
        .eq('agente_id', data.agente.id)
        .order('ordem');
      setData(prev => ({ ...prev, objecoes: (updated || []) as AgenteObjecao[] }));
    }
  }, [replaceMany, data.agente.id]);

  // Save critérios
  const saveCriterios = useCallback(async (criterios: Omit<AgenteCriterioLead, 'id' | 'agente_id'>[]) => {
    const success = await replaceMany('agente_criterios_lead', criterios, 'Critérios salvos!');
    if (success) {
      const { data: updated } = await supabase
        .from('agente_criterios_lead')
        .select('*')
        .eq('agente_id', data.agente.id)
        .order('ordem');
      setData(prev => ({ ...prev, criterios: (updated || []) as AgenteCriterioLead[] }));
    }
  }, [replaceMany, data.agente.id]);

  // Save campos coleta
  const saveColeta = useCallback(async (coleta: Omit<AgenteCampoColeta, 'id' | 'agente_id'>[]) => {
    const success = await replaceMany('agente_campos_coleta', coleta, 'Campos salvos!');
    if (success) {
      const { data: updated } = await supabase
        .from('agente_campos_coleta')
        .select('*')
        .eq('agente_id', data.agente.id)
        .order('ordem');
      setData(prev => ({ ...prev, coleta: (updated || []) as AgenteCampoColeta[] }));
    }
  }, [replaceMany, data.agente.id]);

  // Save argumentos dor
  const saveArgumentos = useCallback(async (argumentos: Omit<AgenteArgumentoDor, 'id' | 'agente_id'>[]) => {
    const success = await replaceMany('agente_argumentos_dor', argumentos, 'Argumentos salvos!');
    if (success) {
      const { data: updated } = await supabase
        .from('agente_argumentos_dor')
        .select('*')
        .eq('agente_id', data.agente.id)
        .order('ordem');
      setData(prev => ({ 
        ...prev, 
        argumentos: (updated || []).map(a => ({
          ...a,
          palavras_chave: (a.palavras_chave as string[]) || [],
        })) as AgenteArgumentoDor[]
      }));
    }
  }, [replaceMany, data.agente.id]);

  // Save voz config
  const saveVoz = useCallback(async (voz: Omit<AgenteVozConfig, 'id' | 'agente_id'>) => {
    const success = await upsertSingle('agente_voz_config', voz, 'Configurações de voz salvas!');
    if (success) {
      setData(prev => ({
        ...prev,
        voz: { ...voz, id: prev.voz?.id || '', agente_id: data.agente.id } as AgenteVozConfig,
      }));
    }
  }, [upsertSingle, data.agente.id]);

  // Save pronúncia
  const savePronuncia = useCallback(async (pronuncia: Omit<AgentePronuncia, 'id' | 'agente_id'>[]) => {
    const success = await replaceMany('agente_pronuncia', pronuncia, 'Pronúncia salva!');
    if (success) {
      const { data: updated } = await supabase
        .from('agente_pronuncia')
        .select('*')
        .eq('agente_id', data.agente.id);
      setData(prev => ({ ...prev, pronuncia: (updated || []) as AgentePronuncia[] }));
    }
  }, [replaceMany, data.agente.id]);

  // Activate agente
  const activateAgente = useCallback(async () => {
    if (!data.agente.id || !validation.isValid) {
      toast({ 
        title: 'Configuração incompleta', 
        description: 'Complete todas as seções obrigatórias antes de ativar',
        variant: 'destructive' 
      });
      return false;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('agentes')
        .update({ status: 'ativo' })
        .eq('id', data.agente.id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        agente: { ...prev.agente, status: 'ativo' },
      }));

      toast({ title: 'Agente ativado com sucesso!' });
      return true;
    } catch (error) {
      console.error('Erro ao ativar agente:', error);
      toast({ title: 'Erro ao ativar', variant: 'destructive' });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data.agente.id, validation.isValid, toast]);

  // Load on mount if agenteId provided
  useEffect(() => {
    if (agenteId) {
      loadAgente(agenteId);
    }
  }, [agenteId, loadAgente]);

  return {
    data,
    setData,
    validation,
    isLoading,
    isSaving,
    currentSection,
    setCurrentSection,
    createAgente,
    loadAgente,
    saveIdentidade,
    saveEmpresa,
    saveRegras,
    saveGatilhos,
    saveFluxo,
    saveFAQ,
    saveObjecoes,
    saveCriterios,
    saveColeta,
    saveArgumentos,
    saveVoz,
    savePronuncia,
    activateAgente,
  };
}
