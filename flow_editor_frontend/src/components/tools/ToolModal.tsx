import { useState } from 'react';
import { X } from 'lucide-react';
import { Tool, ToolType, TOOL_TYPES_INFO, generateToolName } from '@/types/tools';
import { useCreateTool, useUpdateTool } from '@/hooks/useTools';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToolTypeSelector } from './modal/ToolTypeSelector';
import { ToolFormCommon } from './modal/ToolFormCommon';
import { ToolFormVideo } from './modal/forms/ToolFormVideo';
import { ToolFormImagem } from './modal/forms/ToolFormImagem';
import { ToolFormAudio } from './modal/forms/ToolFormAudio';
import { ToolFormArquivo } from './modal/forms/ToolFormArquivo';
import { ToolFormAgendamento } from './modal/forms/ToolFormAgendamento';
import { ToolFormTransferencia } from './modal/forms/ToolFormTransferencia';
import { ToolFormLink } from './modal/forms/ToolFormLink';
import { ToolFormLerDocumentos } from './modal/forms/ToolFormLerDocumentos';

interface ToolModalProps {
  open: boolean;
  onClose: () => void;
  tool: Tool | null;
}

type Step = 'select-type' | 'form';

export function ToolModal({ open, onClose, tool }: ToolModalProps) {
  const isEditing = !!tool;
  const createTool = useCreateTool();
  const updateTool = useUpdateTool();

  const [step, setStep] = useState<Step>(isEditing ? 'form' : 'select-type');
  const [selectedType, setSelectedType] = useState<ToolType | null>(tool?.tool_type || null);
  
  // Common form state
  const [displayName, setDisplayName] = useState(tool?.display_name || '');
  const [aiDescription, setAiDescription] = useState(tool?.ai_description || '');
  const [isActive, setIsActive] = useState(tool?.is_active ?? true);
  
  // Config state (will be set by type-specific forms)
  const [config, setConfig] = useState<any>(tool?.config || {});

  const handleSelectType = (type: ToolType) => {
    setSelectedType(type);
    setStep('form');
    
    // Initialize default config based on type
    const typeInfo = TOOL_TYPES_INFO.find(t => t.type === type);
    if (typeInfo) {
      switch (type) {
        case 'video':
          setConfig({ file_url: '', caption: '', thumbnail_url: '' });
          break;
        case 'imagem':
          setConfig({ file_url: '', caption: '' });
          break;
        case 'audio':
          setConfig({ file_url: '', duration_seconds: 0 });
          break;
        case 'arquivo':
          setConfig({ file_url: '', file_name: '', caption: '' });
          break;
        case 'agendamento':
          setConfig({ calendar_type: 'cal_com', calendar_url: '', duration_minutes: 30, message_before: '', message_after: '' });
          break;
        case 'transferencia':
          setConfig({ department: '', notify_number: '', notify_email: '', message_to_lead: '', message_to_agent: '' });
          break;
        case 'link':
          setConfig({ url: '', link_type: 'website', message: '' });
          break;
        case 'ler_documentos':
          setConfig({ document_source: 'knowledge_base', source_id: '', source_url: '', instructions: '', message_before: '', message_after: '' });
          break;
      }
    }
  };

  const handleBack = () => {
    if (!isEditing) {
      setStep('select-type');
      setSelectedType(null);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after close
    setTimeout(() => {
      setStep(isEditing ? 'form' : 'select-type');
      setSelectedType(tool?.tool_type || null);
      setDisplayName(tool?.display_name || '');
      setAiDescription(tool?.ai_description || '');
      setIsActive(tool?.is_active ?? true);
      setConfig(tool?.config || {});
    }, 200);
  };

  const handleSubmit = async () => {
    if (!selectedType || !displayName.trim() || aiDescription.length < 20) return;

    const toolName = generateToolName(displayName);

    if (isEditing && tool) {
      await updateTool.mutateAsync({
        toolId: tool.id,
        updates: {
          display_name: displayName,
          ai_description: aiDescription,
          config,
          is_active: isActive,
        },
      });
    } else {
      await createTool.mutateAsync({
        tenant_id: '', // Will be set by hook
        tool_name: toolName,
        display_name: displayName,
        tool_type: selectedType,
        ai_description: aiDescription,
        config,
      });
    }

    handleClose();
  };

  const isSubmitting = createTool.isPending || updateTool.isPending;
  const isFormValid = displayName.trim().length > 0 && aiDescription.length >= 20;

  const renderTypeForm = () => {
    switch (selectedType) {
      case 'video':
        return <ToolFormVideo config={config} onChange={setConfig} />;
      case 'imagem':
        return <ToolFormImagem config={config} onChange={setConfig} />;
      case 'audio':
        return <ToolFormAudio config={config} onChange={setConfig} />;
      case 'arquivo':
        return <ToolFormArquivo config={config} onChange={setConfig} />;
      case 'agendamento':
        return <ToolFormAgendamento config={config} onChange={setConfig} />;
      case 'transferencia':
        return <ToolFormTransferencia config={config} onChange={setConfig} />;
      case 'link':
        return <ToolFormLink config={config} onChange={setConfig} />;
      case 'ler_documentos':
        return <ToolFormLerDocumentos config={config} onChange={setConfig} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? 'Editar Tool' : step === 'select-type' ? 'Nova Tool' : 'Configurar Tool'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {step === 'select-type' ? (
          <ToolTypeSelector onSelect={handleSelectType} />
        ) : (
          <div className="space-y-6">
            <ToolFormCommon
              displayName={displayName}
              onDisplayNameChange={setDisplayName}
              aiDescription={aiDescription}
              onAiDescriptionChange={setAiDescription}
              isActive={isActive}
              onIsActiveChange={setIsActive}
              toolType={selectedType}
            />

            <div className="border-t border-border pt-6">
              <h3 className="font-medium text-foreground mb-4">Configurações específicas</h3>
              {renderTypeForm()}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              {!isEditing && (
                <Button variant="ghost" onClick={handleBack}>
                  Voltar
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Tool'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}