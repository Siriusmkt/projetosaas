import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AgenteWizardSidebar } from '@/components/agente-wizard/AgenteWizardSidebar';
import { AgenteWizardContent } from '@/components/agente-wizard/AgenteWizardContent';
import { useAgenteEditor } from '@/hooks/useAgenteEditor';
import type { AgenteSection, AgenteCompleto } from '@/types/agente';

interface AgenteWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agenteId?: string;
  onSaved?: () => void;
}

export function AgenteWizardModal({
  open,
  onOpenChange,
  agenteId,
  onSaved,
}: AgenteWizardModalProps) {
  const [currentSection, setCurrentSection] = useState<AgenteSection>('identidade');
  
  const {
    data,
    setData,
    validation,
    isLoading,
    isSaving,
    createAgente,
    loadAgente,
    saveIdentidade,
    saveEmpresa,
    saveRegras,
    saveGatilhos,
    saveFAQ,
    saveObjecoes,
    saveCriterios,
    saveVoz,
    activateAgente,
  } = useAgenteEditor(agenteId);

  // Reset section when modal opens
  useEffect(() => {
    if (open) {
      setCurrentSection('identidade');
    }
  }, [open]);

  // Handle update for sections
  const handleUpdate = useCallback((updates: Partial<AgenteCompleto>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, [setData]);

  // Save current section before moving
  const handleSaveSection = useCallback(async () => {
    switch (currentSection) {
      case 'identidade':
        if (data.identidade) {
          await saveIdentidade(data.identidade);
        }
        break;
      case 'empresa':
        if (data.empresa) {
          await saveEmpresa(data.empresa);
        }
        break;
      case 'regras':
        await saveRegras(data.regras);
        break;
      case 'gatilhos':
        await saveGatilhos(data.gatilhos);
        break;
      case 'respostas':
        await saveFAQ(data.faq);
        await saveObjecoes(data.objecoes);
        break;
      case 'qualificacao':
        await saveCriterios(data.criterios);
        break;
      case 'voz':
        if (data.voz) {
          await saveVoz(data.voz);
        }
        break;
    }
  }, [currentSection, data, saveIdentidade, saveEmpresa, saveRegras, saveGatilhos, saveFAQ, saveObjecoes, saveCriterios, saveVoz]);

  // Navigate sections
  const sections: AgenteSection[] = ['identidade', 'empresa', 'regras', 'gatilhos', 'respostas', 'qualificacao', 'voz'];

  const handleNext = useCallback(async () => {
    await handleSaveSection();
    const currentIndex = sections.indexOf(currentSection);
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1]);
    }
  }, [currentSection, handleSaveSection, sections]);

  const handlePrev = useCallback(() => {
    const currentIndex = sections.indexOf(currentSection);
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1]);
    }
  }, [currentSection, sections]);

  const handleSaveAndClose = useCallback(async () => {
    await handleSaveSection();
    if (validation.isValid) {
      await activateAgente();
    }
    onSaved?.();
    onOpenChange(false);
  }, [handleSaveSection, validation.isValid, activateAgente, onSaved, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex">
        {/* Sidebar */}
        <AgenteWizardSidebar
          currentSection={currentSection}
          validation={validation}
          onSectionChange={setCurrentSection}
          onClose={handleClose}
        />

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <AgenteWizardContent
            currentSection={currentSection}
            agente={data}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onPrev={handlePrev}
            onSave={handleSaveAndClose}
            isSaving={isSaving}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
