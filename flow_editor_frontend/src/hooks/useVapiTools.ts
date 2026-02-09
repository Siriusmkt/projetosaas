import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { VapiTool } from '@/types/vapiTools';

export function useVapiTools(tenantId?: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['vapi-tools', tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<VapiTool[]> => {
      const response = await fetch(`/api/tools/${encodeURIComponent(tenantId || '')}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Erro ao carregar tools');
      }
      const data = await response.json();
      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao carregar tools');
      }
      return Array.isArray(data.tools) ? data.tools : [];
    },
    staleTime: 30_000,
    onError: (error: Error) => {
      toast({
        title: 'Erro ao carregar tools',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
