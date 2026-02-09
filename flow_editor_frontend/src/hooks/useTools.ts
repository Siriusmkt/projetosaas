import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tool, CreateToolInput, UpdateToolInput, ToolType, ToolConfig, ToolParameter } from '@/types/tools';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

// Helper para converter dados do DB para o tipo Tool
function mapDbToTool(dbTool: any): Tool {
  return {
    id: dbTool.id,
    tenant_id: dbTool.tenant_id,
    tool_name: dbTool.tool_name,
    display_name: dbTool.display_name,
    tool_type: dbTool.tool_type as ToolType,
    ai_description: dbTool.ai_description,
    config: (dbTool.config || {}) as ToolConfig,
    parameters: (dbTool.parameters || []) as ToolParameter[],
    is_active: dbTool.is_active,
    created_at: dbTool.created_at,
    updated_at: dbTool.updated_at,
    tool_assets: dbTool.tool_assets || [],
  };
}

// ID fixo para demo sem autenticação
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export function useTools() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['tools'],
    enabled: false, // Tabela assistant_tools pode não existir no Supabase — evita 404 no console
    queryFn: async (): Promise<Tool[]> => {
      const { data, error } = await supabase
        .from('assistant_tools')
        .select(`
          *,
          tool_assets (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Tabela assistant_tools pode não existir no projeto (404) — não quebrar a UI
        const isMissing = error.code === 'PGRST116' || (error as any).status === 404 || String(error.message || '').includes('404');
        if (!isMissing) {
          toast({
            title: 'Erro ao carregar tools',
            description: error.message,
            variant: 'destructive',
          });
        }
        return [];
      }

      return (data || []).map(mapDbToTool);
    },
    retry: (_, error: any) => {
      // Não repetir se for 404 / tabela não existe
      return error?.code !== 'PGRST116' && error?.status !== 404 && !String(error?.message || '').includes('404');
    },
  });
}

export function useTool(toolId: string | undefined) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['tool', toolId],
    queryFn: async (): Promise<Tool | null> => {
      if (!toolId) return null;

      const { data, error } = await supabase
        .from('assistant_tools')
        .select(`
          *,
          tool_assets (*)
        `)
        .eq('id', toolId)
        .maybeSingle();

      if (error) {
        const isMissing = error.code === 'PGRST116' || (error as any).status === 404;
        if (!isMissing) {
          toast({
            title: 'Erro ao carregar tool',
            description: error.message,
            variant: 'destructive',
          });
        }
        return null;
      }

      return data ? mapDbToTool(data) : null;
    },
    enabled: !!toolId,
  });
}

export function useCreateTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateToolInput): Promise<Tool> => {
      const { data, error } = await supabase
        .from('assistant_tools')
        .insert([{
          tenant_id: DEMO_TENANT_ID,
          tool_name: input.tool_name,
          display_name: input.display_name,
          tool_type: input.tool_type as any, // Cast para contornar limitação do tipo do DB
          ai_description: input.ai_description,
          config: input.config as unknown as Json,
          parameters: (input.parameters || []) as unknown as Json,
        }])
        .select()
        .single();

      if (error) throw error;
      return mapDbToTool(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast({
        title: 'Tool criada!',
        description: 'Sua nova tool foi criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar tool',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ toolId, updates }: { toolId: string; updates: UpdateToolInput }): Promise<Tool> => {
      const updatePayload: Record<string, any> = {};
      if (updates.display_name !== undefined) updatePayload.display_name = updates.display_name;
      if (updates.ai_description !== undefined) updatePayload.ai_description = updates.ai_description;
      if (updates.config !== undefined) updatePayload.config = updates.config as unknown as Json;
      if (updates.parameters !== undefined) updatePayload.parameters = updates.parameters as unknown as Json;
      if (updates.is_active !== undefined) updatePayload.is_active = updates.is_active;

      const { data, error } = await supabase
        .from('assistant_tools')
        .update(updatePayload)
        .eq('id', toolId)
        .select()
        .single();

      if (error) throw error;
      return mapDbToTool(data);
    },
    onSuccess: (_, { toolId }) => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['tool', toolId] });
      toast({
        title: 'Tool atualizada!',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar tool',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (toolId: string): Promise<void> => {
      const { error } = await supabase
        .from('assistant_tools')
        .delete()
        .eq('id', toolId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast({
        title: 'Tool excluída',
        description: 'A tool foi removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir tool',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useToggleToolStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ toolId, isActive }: { toolId: string; isActive: boolean }): Promise<void> => {
      const { error } = await supabase
        .from('assistant_tools')
        .update({ is_active: isActive })
        .eq('id', toolId);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast({
        title: isActive ? 'Tool ativada' : 'Tool desativada',
        description: isActive 
          ? 'A tool agora pode ser usada pelos assistentes.' 
          : 'A tool foi temporariamente desativada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDuplicateTool() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tool: Tool): Promise<Tool> => {
      const { data, error } = await supabase
        .from('assistant_tools')
        .insert([{
          tenant_id: DEMO_TENANT_ID,
          tool_name: `${tool.tool_name}_copy`,
          display_name: `Cópia de ${tool.display_name}`,
          tool_type: tool.tool_type as any, // Cast para contornar limitação do tipo do DB
          ai_description: tool.ai_description,
          config: tool.config as unknown as Json,
          parameters: tool.parameters as unknown as Json,
          is_active: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return mapDbToTool(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      toast({
        title: 'Tool duplicada!',
        description: 'Uma cópia da tool foi criada.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao duplicar tool',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
