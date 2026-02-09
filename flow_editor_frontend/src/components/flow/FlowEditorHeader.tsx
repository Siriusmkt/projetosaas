import { Eye, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlowEditorHeaderProps {
  assistantName?: string;
  onPreview: () => void;
  onExport: () => void;
  onSave: () => void;
}

export function FlowEditorHeader({
  assistantName = 'Assistente',
  onPreview,
  onExport,
  onSave,
}: FlowEditorHeaderProps) {
  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{assistantName}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={onSave}>
            <Save className="w-4 h-4 mr-1.5" />
            Salvar
          </Button>
        </div>
      </div>
    </header>
  );
}