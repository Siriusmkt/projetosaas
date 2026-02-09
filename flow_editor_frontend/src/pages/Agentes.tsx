import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AgentesPageHeader } from '@/components/agentes/AgentesPageHeader';
import { AgentesGrid } from '@/components/agentes/AgentesGrid';
import { useAgentes } from '@/hooks/useAgentes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Agente } from '@/types/agente';

export default function AgentesPage() {
  const navigate = useNavigate();
  const {
    agentes,
    isLoading,
    refetch,
    create,
    delete: deleteAgente,
    duplicate,
    isCreating,
  } = useAgentes();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agenteToDelete, setAgenteToDelete] = useState<string | null>(null);

  // Calculate stats
  const stats = useMemo(() => {
    const ativos = agentes.filter(a => a.status === 'ativo').length;
    return { ativos };
  }, [agentes]);

  // Create new agente and navigate to config page
  const handleCriar = useCallback(async () => {
    const agente = await create('Novo Agente');
    if (agente) {
      navigate(`/agente/${agente.id}/configurar`);
    }
  }, [create, navigate]);

  // Edit agente - Navigate to Flow Editor with chat open
  const handleEdit = useCallback((agente: Agente) => {
    navigate(`/flow-editor/${agente.id}`);
  }, [navigate]);

  // Duplicate agente
  const handleDuplicate = useCallback((id: string) => {
    duplicate(id);
  }, [duplicate]);

  // Delete agente (show confirmation first)
  const handleDeleteClick = useCallback((id: string) => {
    setAgenteToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (agenteToDelete) {
      deleteAgente(agenteToDelete);
      setAgenteToDelete(null);
    }
    setDeleteDialogOpen(false);
  }, [agenteToDelete, deleteAgente]);

  // Open flow editor
  const handleOpenFlow = useCallback((id: string) => {
    navigate(`/flow-editor/${id}`);
  }, [navigate]);

  return (
    <MainLayout>
      {/* Content */}
      <div className="py-8 px-8 max-w-[1400px] mx-auto">
        {/* Header with Stats */}
        <AgentesPageHeader
          totalAgentes={agentes.length}
          ativos={stats.ativos}
          totalCalls={0}
          onCriar={handleCriar}
          isCreating={isCreating}
        />

        {/* Grid */}
        <div className="mt-8">
          <AgentesGrid
            agentes={agentes}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteClick}
            onOpenFlow={handleOpenFlow}
            onCriar={handleCriar}
          />
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent 
          className="bg-gradient-to-br from-[#1a0b33] to-[#2d1055] border-[rgba(239,68,68,0.5)] max-w-[520px]"
        >
          <AlertDialogHeader className="text-center">
            {/* Delete Icon */}
            <div className="w-20 h-20 mx-auto mb-7 bg-[rgba(239,68,68,0.2)] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <AlertDialogTitle className="text-[1.75rem] text-white mb-5">
              Excluir Assistente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[rgba(255,255,255,0.7)] text-[1.05rem]">
              Esta ação não pode ser desfeita. Todos os dados do assistente, incluindo configurações, fluxos e histórico serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-4 mt-10">
            <AlertDialogCancel 
              className="flex-1 py-4 px-8 text-[1.1rem] font-semibold bg-[rgba(255,255,255,0.06)] text-white border-2 border-[rgba(255,255,255,0.2)] rounded-xl hover:bg-[rgba(255,255,255,0.12)] hover:translate-y-[-2px] transition-all"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="flex-1 py-4 px-8 text-[1.1rem] font-semibold bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white border-0 rounded-xl hover:shadow-[0_8px_24px_rgba(239,68,68,0.6),0_0_40px_rgba(239,68,68,0.4)] hover:translate-y-[-2px] transition-all"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
