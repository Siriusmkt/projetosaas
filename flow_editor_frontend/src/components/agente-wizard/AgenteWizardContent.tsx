import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { 
  AgenteSection, 
  AGENTE_SECTIONS,
  AgenteCompleto,
  AgenteIdentidade,
  AgenteEmpresa,
  AgenteVozConfig,
  validateAgente,
  DEFAULT_AGENTE_REGRAS,
} from '@/types/agente';
import { IdentidadeForm } from './forms/IdentidadeForm';
import { EmpresaForm } from './forms/EmpresaForm';
import { RegrasForm } from './forms/RegrasForm';
import { GatilhosForm } from './forms/GatilhosForm';
import { RespostasForm } from './forms/RespostasForm';
import { QualificacaoForm } from './forms/QualificacaoForm';
import { VozForm } from './forms/VozForm';

interface AgenteWizardContentProps {
  currentSection: AgenteSection;
  agente: AgenteCompleto;
  onUpdate: (updates: Partial<AgenteCompleto>) => void;
  onNext: () => void;
  onPrev: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function AgenteWizardContent({
  currentSection,
  agente,
  onUpdate,
  onNext,
  onPrev,
  onSave,
  isSaving,
}: AgenteWizardContentProps) {
  const currentIndex = AGENTE_SECTIONS.findIndex(s => s.id === currentSection);
  const sectionConfig = AGENTE_SECTIONS[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === AGENTE_SECTIONS.length - 1;
  const validation = validateAgente(agente);

  const renderForm = () => {
    switch (currentSection) {
      case 'identidade':
        return (
          <IdentidadeForm
            data={agente.identidade || {}}
            onChange={(data) => onUpdate({ identidade: data as AgenteIdentidade })}
          />
        );
      case 'empresa':
        return (
          <EmpresaForm
            data={agente.empresa || {}}
            onChange={(data) => onUpdate({ empresa: data as AgenteEmpresa })}
          />
        );
      case 'regras':
        return (
          <RegrasForm
            data={agente.regras.length > 0 ? agente.regras : DEFAULT_AGENTE_REGRAS.map((r, i) => ({
              ...r,
              id: `temp_${i}`,
              agente_id: agente.agente.id,
            }))}
            onChange={(data) => onUpdate({ regras: data })}
          />
        );
      case 'gatilhos':
        return (
          <GatilhosForm
            data={agente.gatilhos}
            onChange={(data) => onUpdate({ gatilhos: data })}
          />
        );
      case 'respostas':
        return (
          <RespostasForm
            faq={agente.faq}
            objecoes={agente.objecoes}
            onChangeFaq={(data) => onUpdate({ faq: data })}
            onChangeObjecoes={(data) => onUpdate({ objecoes: data })}
          />
        );
      case 'qualificacao':
        return (
          <QualificacaoForm
            data={agente.criterios}
            onChange={(data) => onUpdate({ criterios: data })}
          />
        );
      case 'voz':
        return (
          <VozForm
            data={agente.voz || {}}
            onChange={(data) => onUpdate({ voz: data as AgenteVozConfig })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
            {currentIndex + 1}
          </span>
          <div>
            <h2 className="font-semibold">{sectionConfig.nome}</h2>
            <p className="text-sm text-muted-foreground">{sectionConfig.descricao}</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {renderForm()}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t bg-card flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isFirst}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          {!isLast ? (
            <Button onClick={onNext}>
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={onSave}
              disabled={isSaving || !validation.isValid}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar e Ativar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}