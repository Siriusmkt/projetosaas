import { useEffect } from 'react';
import { Wrench } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ToolsConfigPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToolsConfigPanel({ open, onOpenChange }: ToolsConfigPanelProps) {
  // Probe fetch: run in useEffect so we never render a Promise (React error #31)
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    fetch('/vapi-tools/index.html').catch(() => {});
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[560px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Gerenciar Tools
            </span>
            <a
              href="/vapi-tools/index.html"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Abrir em nova aba
            </a>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden bg-background">
          <iframe
            title="Gerenciar ferramentas"
            src="/vapi-tools/index.html"
            className="w-full h-full border-0"
            onLoad={() => {}}
            onError={() => {}}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
