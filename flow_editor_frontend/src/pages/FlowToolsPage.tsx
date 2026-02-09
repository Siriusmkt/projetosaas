import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FlowToolsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assistenteId = searchParams.get('assistente_id') || searchParams.get('assistant_id') || '';
  const tenantId = searchParams.get('tenant_id') || '';
  const params = new URLSearchParams();
  if (assistenteId) params.set('assistente_id', assistenteId);
  if (tenantId) params.set('tenant_id', tenantId);
  const iframeSrc = '/vapi-tools/index.html' + (params.toString() ? '?' + params.toString() : '');

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate('/')}
          title="Voltar ao editor de fluxo"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Flow Editor
        </Button>
        <span className="text-sm text-muted-foreground">Gerenciar Tools</span>
      </header>
      <div className="flex-1 min-h-0">
        <iframe
          title="Gerenciar ferramentas"
          src={iframeSrc}
          className="w-full h-full border-0 block"
        />
      </div>
    </div>
  );
}
