import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  User,
  Building2,
  Shield,
  Zap,
  MessageSquare,
  Target,
  Volume2,
  Check,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgenteEditor } from '@/hooks/useAgenteEditor';
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
import { IdentidadeForm } from '@/components/agente-wizard/forms/IdentidadeForm';
import { EmpresaForm } from '@/components/agente-wizard/forms/EmpresaForm';
import { RegrasForm } from '@/components/agente-wizard/forms/RegrasForm';
import { GatilhosForm } from '@/components/agente-wizard/forms/GatilhosForm';
import { RespostasForm } from '@/components/agente-wizard/forms/RespostasForm';
import { QualificacaoForm } from '@/components/agente-wizard/forms/QualificacaoForm';
import { VozForm } from '@/components/agente-wizard/forms/VozForm';

const SECTION_ICONS: Record<string, React.ElementType> = {
  identidade: User,
  empresa: Building2,
  regras: Shield,
  gatilhos: Zap,
  respostas: MessageSquare,
  qualificacao: Target,
  voz: Volume2,
};

export default function AgenteConfigPage() {
  const navigate = useNavigate();
  const { agenteId } = useParams<{ agenteId: string }>();
  const [currentSection, setCurrentSection] = useState<AgenteSection>('identidade');
  
  const {
    data,
    setData,
    validation,
    isLoading,
    isSaving,
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

  // Load agente on mount
  useEffect(() => {
    if (agenteId) {
      loadAgente(agenteId);
    }
  }, [agenteId, loadAgente]);

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
  const currentIndex = sections.indexOf(currentSection);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === sections.length - 1;

  const handleNext = useCallback(async () => {
    await handleSaveSection();
    if (currentIndex < sections.length - 1) {
      setCurrentSection(sections[currentIndex + 1]);
    }
  }, [currentIndex, handleSaveSection, sections]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1]);
    }
  }, [currentIndex, sections]);

  const handleSaveAndFinish = useCallback(async () => {
    await handleSaveSection();
    if (validation.isValid) {
      await activateAgente();
    }
    navigate('/agentes');
  }, [handleSaveSection, validation.isValid, activateAgente, navigate]);

  const handleClose = useCallback(() => {
    navigate('/agentes');
  }, [navigate]);

  const renderForm = () => {
    switch (currentSection) {
      case 'identidade':
        return (
          <IdentidadeForm
            data={data.identidade || {}}
            onChange={(formData) => handleUpdate({ identidade: formData as AgenteIdentidade })}
          />
        );
      case 'empresa':
        return (
          <EmpresaForm
            data={data.empresa || {}}
            onChange={(formData) => handleUpdate({ empresa: formData as AgenteEmpresa })}
          />
        );
      case 'regras':
        return (
          <RegrasForm
            data={data.regras.length > 0 ? data.regras : DEFAULT_AGENTE_REGRAS.map((r, i) => ({
              ...r,
              id: `temp_${i}`,
              agente_id: data.agente.id,
            }))}
            onChange={(formData) => handleUpdate({ regras: formData })}
          />
        );
      case 'gatilhos':
        return (
          <GatilhosForm
            data={data.gatilhos}
            onChange={(formData) => handleUpdate({ gatilhos: formData })}
          />
        );
      case 'respostas':
        return (
          <RespostasForm
            faq={data.faq}
            objecoes={data.objecoes}
            onChangeFaq={(formData) => handleUpdate({ faq: formData })}
            onChangeObjecoes={(formData) => handleUpdate({ objecoes: formData })}
          />
        );
      case 'qualificacao':
        return (
          <QualificacaoForm
            data={data.criterios}
            onChange={(formData) => handleUpdate({ criterios: formData })}
          />
        );
      case 'voz':
        return (
          <VozForm
            data={data.voz || {}}
            onChange={(formData) => handleUpdate({ voz: formData as AgenteVozConfig })}
          />
        );
      default:
        return null;
    }
  };

  const sectionConfig = AGENTE_SECTIONS[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0420] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#A594FF] animate-spin" />
          <p className="text-[rgba(255,255,255,0.7)]">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0420] text-white overflow-hidden relative" style={{ fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Aurora effect */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute w-[150%] h-[150%] -top-1/4 -left-1/4"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(165, 148, 255, 0.1) 30%, rgba(102, 126, 234, 0.15) 50%, transparent 100%)',
              animation: 'aurora1 10s ease-in-out infinite',
            }}
          />
        </div>
        
        {/* Morphing background */}
        <div 
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'linear-gradient(45deg, rgba(165, 148, 255, 0.1), rgba(102, 126, 234, 0.1))',
            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
            filter: 'blur(60px)',
            animation: 'morphing 15s ease-in-out infinite',
          }}
        />
        
        {/* Orbs */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full top-[10%] -left-[10%]"
          style={{
            background: 'rgba(165, 148, 255, 0.15)',
            filter: 'blur(80px)',
            animation: 'orbFloat1 20s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute w-[300px] h-[300px] rounded-full bottom-[10%] -right-[5%]"
          style={{
            background: 'rgba(102, 126, 234, 0.12)',
            filter: 'blur(80px)',
            animation: 'orbFloat2 25s ease-in-out infinite',
          }}
        />
      </div>

      {/* Progress Bar - Fixed top */}
      <div 
        className="fixed top-0 left-0 w-full h-[70px] z-[1000] flex items-center px-[30px] gap-5"
        style={{
          background: 'linear-gradient(180deg, rgba(10, 4, 32, 0.98) 0%, rgba(10, 4, 32, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(165, 148, 255, 0.2)',
        }}
      >
        {/* Logo / Back button */}
        <button
          onClick={handleClose}
          className="flex items-center gap-3 text-[rgba(255,255,255,0.8)] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[0.95rem] font-semibold">Voltar</span>
        </button>

        {/* Progress wrapper */}
        <div className="flex-1 flex flex-col gap-1.5">
          {/* Step indicators */}
          <div className="flex items-center justify-between gap-2">
            {sections.map((section, index) => {
              const isComplete = validation.completedSections.includes(section);
              const isCurrent = section === currentSection;
              
              return (
                <div
                  key={section}
                  onClick={() => setCurrentSection(section)}
                  className={cn(
                    "flex-1 h-1 rounded-[4px] overflow-hidden relative transition-all duration-500 cursor-pointer",
                    isComplete 
                      ? "bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      : isCurrent
                        ? "bg-gradient-to-r from-[#A594FF] to-[#667eea] shadow-[0_0_15px_rgba(165,148,255,0.6)] scale-y-150"
                        : "bg-[rgba(255,255,255,0.1)]"
                  )}
                >
                  {isCurrent && (
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        animation: 'shimmerStep 2s infinite',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Step info */}
          <div className="flex justify-between items-center">
            <span className="text-[0.85rem] font-semibold text-[#C4B8FF]">
              {sectionConfig?.nome}
            </span>
            <span className="text-[0.8rem] text-[rgba(255,255,255,0.5)] font-medium">
              {currentIndex + 1} de {sections.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main container */}
      <div className="pt-[80px] pb-[60px] min-h-screen relative z-[1]">
        <div className="max-w-[720px] mx-auto px-5">
          {/* Card */}
          <div 
            className="relative overflow-hidden rounded-[24px] p-10 transition-all duration-500 hover:translate-y-[-5px]"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(165, 148, 255, 0.2)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 60px rgba(165, 148, 255, 0.05)',
            }}
          >
            {/* Section header */}
            <div className="text-center mb-10">
              {/* Icon */}
              <div 
                className="w-[70px] h-[70px] mx-auto mb-5 rounded-[20px] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-[5deg] hover:shadow-[0_0_30px_rgba(165,148,255,0.5)]"
                style={{
                  background: 'linear-gradient(135deg, rgba(165, 148, 255, 0.15), rgba(102, 126, 234, 0.1))',
                  border: '1px solid rgba(165, 148, 255, 0.2)',
                }}
              >
                {sectionConfig && (
                  (() => {
                    const Icon = SECTION_ICONS[sectionConfig.id];
                    return <Icon className="w-8 h-8 text-[#C4B8FF]" strokeWidth={1.5} />;
                  })()
                )}
              </div>
              
              {/* Title */}
              <h2 
                className="text-[1.8rem] font-extrabold mb-2.5"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #C4B8FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {sectionConfig?.nome}
              </h2>
              <p className="text-[1rem] text-[rgba(255,255,255,0.75)] leading-relaxed">
                {sectionConfig?.descricao}
              </p>
            </div>

            {/* Form content */}
            <ScrollArea className="max-h-[calc(100vh-400px)]">
              <div className="pr-4">
                {renderForm()}
              </div>
            </ScrollArea>

            {/* Navigation */}
            <div 
              className="flex justify-between items-center mt-10 pt-[30px] gap-4"
              style={{
                borderTop: '1px solid rgba(165, 148, 255, 0.2)',
              }}
            >
              {/* Back button */}
              <button
                onClick={handlePrev}
                disabled={isFirst}
                className={cn(
                  "flex items-center gap-2.5 py-3.5 px-8 text-[0.95rem] font-bold rounded-[14px] transition-all duration-500",
                  "border",
                  isFirst
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-[rgba(255,255,255,0.08)] border-[rgba(165,148,255,0.2)] text-[rgba(255,255,255,0.75)] hover:bg-[rgba(255,255,255,0.12)] hover:text-white hover:-translate-x-1"
                )}
              >
                <ArrowLeft className="w-[18px] h-[18px] transition-transform" />
                Voltar
              </button>

              {/* Next / Finish button */}
              {!isLast ? (
                <button
                  onClick={handleNext}
                  disabled={isSaving}
                  className={cn(
                    "flex items-center gap-2.5 py-3.5 px-8 text-[0.95rem] font-bold rounded-[14px] transition-all duration-500",
                    "bg-gradient-to-r from-[#A594FF] to-[#667eea] text-white",
                    "shadow-[0_4px_20px_rgba(165,148,255,0.4)]",
                    "hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(165,148,255,0.5)]",
                    isSaving && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-[18px] h-[18px] animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="w-[18px] h-[18px] transition-transform" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSaveAndFinish}
                  disabled={isSaving || !validation.isValid}
                  className={cn(
                    "flex items-center gap-2.5 py-3.5 px-8 text-[0.95rem] font-bold rounded-[14px] transition-all duration-500",
                    "bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white",
                    "shadow-[0_4px_20px_rgba(34,197,94,0.4)]",
                    "hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(34,197,94,0.5)]",
                    (isSaving || !validation.isValid) && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-[18px] h-[18px] animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check className="w-[18px] h-[18px]" />
                      Salvar e Ativar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes aurora1 {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(10deg) translateY(-50px); }
        }
        @keyframes morphing {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75% { border-radius: 60% 40% 60% 30% / 70% 30% 50% 60%; }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 30px) scale(1.1); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, -50px) scale(1.15); }
        }
        @keyframes shimmerStep {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
