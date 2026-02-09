import { useState, useEffect } from 'react';
import { usePromptEditor } from '@/hooks/usePromptEditor';
import { PromptEditorSidebar } from './PromptEditorSidebar';
import { IdentidadeSection } from './sections/IdentidadeSection';
import { EmpresaSection } from './sections/EmpresaSection';
import { RegrasSection } from './sections/RegrasSection';
import { FluxoGatilhosSection } from './sections/FluxoGatilhosSection';
import { ScriptsSection } from './sections/ScriptsSection';
import { FAQSection } from './sections/FAQSection';
import { ObjecoesSection } from './sections/ObjecoesSection';
import { ConectivosSection } from './sections/ConectivosSection';
import { DiferenciaisSection } from './sections/DiferenciaisSection';
import { CriteriosSection } from './sections/CriteriosSection';
import { ColetaSection } from './sections/ColetaSection';
import { TomSection } from './sections/TomSection';
import { PronunciaSection } from './sections/PronunciaSection';
import { PreviewSection } from './sections/PreviewSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Pencil, Check, X } from 'lucide-react';
import type { PromptSection } from '@/types/prompt';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PromptEditorProps {
  promptId?: string;
  onBack?: () => void;
}

export function PromptEditor({ promptId, onBack }: PromptEditorProps) {
  const {
    data,
    isLoading,
    isSaving,
    currentSection,
    setCurrentSection,
    createPrompt,
    saveIdentidade,
    saveInstitucional,
    saveRegras,
    saveGatilhos,
    saveScripts,
    saveFluxo,
    saveFAQ,
    saveObjecoes,
    saveConectivos,
    saveDiferenciais,
    saveCriterios,
    saveColeta,
    saveTom,
    savePronuncia,
    updatePromptName,
    getSectionProgress,
  } = usePromptEditor(promptId);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(data.prompt.nome_prompt);

  useEffect(() => {
    setTempName(data.prompt.nome_prompt);
  }, [data.prompt.nome_prompt]);

  // Auto-criar prompt se não existir
  useEffect(() => {
    if (!promptId && !data.prompt.id) {
      createPrompt('Novo Prompt');
    }
  }, [promptId, data.prompt.id, createPrompt]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      updatePromptName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const getItemCount = (section: PromptSection): number | undefined => {
    switch (section) {
      case 'regras': return data.regras.length;
      case 'fluxo': return data.fluxo.length + data.gatilhos.length;
      case 'scripts': return data.scripts.length;
      case 'faq': return data.faq.length;
      case 'objecoes': return data.objecoes.length;
      case 'conectivos': return data.conectivos.length;
      case 'diferenciais': return data.diferenciais.length;
      case 'criterios': return data.criterios.length;
      case 'coleta': return data.coleta.length;
      case 'pronuncia': return data.pronuncia.length;
      default: return undefined;
    }
  };

  const handleSectionSave = async () => {
    // Avançar para próxima seção após salvar
    const sections: PromptSection[] = [
      'identidade', 'empresa', 'regras', 'fluxo', 'scripts', 
      'faq', 'objecoes', 'conectivos', 'diferenciais', 
      'criterios', 'coleta', 'tom', 'pronuncia', 'preview'
    ];
    const currentIndex = sections.indexOf(currentSection);
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1]);
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'identidade':
        return (
          <IdentidadeSection 
            data={data.identidade} 
            onSave={async (d) => { await saveIdentidade(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'empresa':
        return (
          <EmpresaSection 
            data={data.institucional} 
            onSave={async (d) => { await saveInstitucional(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'regras':
        return (
          <RegrasSection 
            data={data.regras} 
            onSave={async (d) => { await saveRegras(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'fluxo':
        return (
          <FluxoGatilhosSection 
            gatilhos={data.gatilhos}
            fluxo={data.fluxo}
            onSaveGatilhos={saveGatilhos}
            onSaveFluxo={async (d) => { await saveFluxo(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'scripts':
        return (
          <ScriptsSection 
            data={data.scripts} 
            onSave={async (d) => { await saveScripts(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'faq':
        return (
          <FAQSection 
            data={data.faq} 
            onSave={async (d) => { await saveFAQ(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'objecoes':
        return (
          <ObjecoesSection 
            data={data.objecoes} 
            onSave={async (d) => { await saveObjecoes(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'conectivos':
        return (
          <ConectivosSection 
            data={data.conectivos} 
            onSave={async (d) => { await saveConectivos(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'diferenciais':
        return (
          <DiferenciaisSection 
            data={data.diferenciais} 
            onSave={async (d) => { await saveDiferenciais(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'criterios':
        return (
          <CriteriosSection 
            data={data.criterios} 
            onSave={async (d) => { await saveCriterios(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'coleta':
        return (
          <ColetaSection 
            data={data.coleta} 
            onSave={async (d) => { await saveColeta(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'tom':
        return (
          <TomSection 
            data={data.tom} 
            onSave={async (d) => { await saveTom(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'pronuncia':
        return (
          <PronunciaSection 
            data={data.pronuncia} 
            onSave={async (d) => { await savePronuncia(d); handleSectionSave(); }}
            isSaving={isSaving}
          />
        );
      case 'preview':
        return <PreviewSection data={data} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground mb-4">
              Esta seção está em desenvolvimento
            </p>
            <Button variant="outline" onClick={() => setCurrentSection('preview')}>
              Ir para Preview
            </Button>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 border-b bg-card z-10 flex items-center px-4 gap-4">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="h-8 w-64"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
            />
            <Button variant="ghost" size="icon" onClick={handleSaveName}>
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsEditingName(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded transition-colors"
          >
            <h1 className="font-semibold">{data.prompt.nome_prompt}</h1>
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
        
        <Badge variant={data.prompt.status === 'ativo' ? 'default' : 'secondary'}>
          {data.prompt.status}
        </Badge>
        
        <div className="flex-1" />
        
        {isSaving && (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando...
          </span>
        )}
      </div>

      {/* Sidebar */}
      <div className="pt-14">
        <PromptEditorSidebar
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          getSectionProgress={getSectionProgress}
          getItemCount={getItemCount}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-14">
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="max-w-3xl mx-auto p-8">
            {renderSection()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
