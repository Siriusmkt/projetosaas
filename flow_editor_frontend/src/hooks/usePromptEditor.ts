// Stub hook - migrated to useAgenteEditor
import { useState } from 'react';
import type { PromptSection } from '@/types/prompt';

export function usePromptEditor(promptId?: string) {
  const [isLoading] = useState(false);
  const [isSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState<PromptSection>('identidade');
  const [data] = useState<any>({
    prompt: { id: '', nome_prompt: '', status: 'rascunho', created_at: '', updated_at: '' },
    identidade: null, institucional: null, regras: [], gatilhos: [], scripts: [],
    fluxo: [], faq: [], objecoes: [], conectivos: [], diferenciais: [],
    criterios: [], coleta: [], tom: null, pronuncia: [],
  });

  return {
    data, isLoading, isSaving, currentSection, setCurrentSection,
    createPrompt: async (_n: string) => null,
    loadPrompt: async (_id: string) => {},
    updatePromptName: async (_n: string) => {},
    getSectionProgress: (_s: PromptSection): 'complete' | 'partial' | 'empty' => 'empty',
    saveIdentidade: async (_d: any) => {},
    saveInstitucional: async (_d: any) => {},
    saveRegras: async (_d: any) => {},
    saveGatilhos: async (_d: any) => {},
    saveScripts: async (_d: any) => {},
    saveFluxo: async (_d: any) => {},
    saveFAQ: async (_d: any) => {},
    saveObjecoes: async (_d: any) => {},
    saveConectivos: async (_d: any) => {},
    saveDiferenciais: async (_d: any) => {},
    saveCriterios: async (_d: any) => {},
    saveColeta: async (_d: any) => {},
    saveTom: async (_d: any) => {},
    savePronuncia: async (_d: any) => {},
  };
}
