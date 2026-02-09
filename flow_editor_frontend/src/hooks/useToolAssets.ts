import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ToolAsset } from '@/types/tools';
import { useToast } from '@/hooks/use-toast';

interface UploadAssetInput {
  toolId: string;
  file: File;
}

const DEMO_FOLDER = 'demo';

export function useUploadToolAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ toolId, file }: UploadAssetInput): Promise<ToolAsset> => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${DEMO_FOLDER}/${toolId}/${Date.now()}.${fileExt}`;

      // Upload para Storage
      const { error: uploadError } = await supabase.storage
        .from('tool-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Pegar URL pública
      const { data: urlData } = supabase.storage
        .from('tool-assets')
        .getPublicUrl(fileName);

      // Salvar referência no banco
      const { data, error } = await supabase
        .from('tool_assets')
        .insert({
          tool_id: toolId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ToolAsset;
    },
    onSuccess: (_, { toolId }) => {
      queryClient.invalidateQueries({ queryKey: ['tool', toolId] });
      toast({
        title: 'Arquivo enviado!',
        description: 'O arquivo foi carregado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteToolAsset() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ assetId, fileUrl, toolId }: { assetId: string; fileUrl: string; toolId: string }): Promise<void> => {
      // Extrair path do arquivo da URL
      const urlParts = fileUrl.split('/tool-assets/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('tool-assets').remove([filePath]);
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from('tool_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: (_, { toolId }) => {
      queryClient.invalidateQueries({ queryKey: ['tool', toolId] });
      toast({
        title: 'Arquivo removido',
        description: 'O arquivo foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover arquivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
