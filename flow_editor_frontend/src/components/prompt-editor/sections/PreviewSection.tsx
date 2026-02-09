import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, Check, Eye, Code, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePrompt } from '@/lib/generatePrompt';
import type { PromptCompleto } from '@/types/prompt';
import ReactMarkdown from 'react-markdown';

interface PreviewSectionProps {
  data: PromptCompleto;
}

export function PreviewSection({ data }: PreviewSectionProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const promptText = generatePrompt(data);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    toast({ title: 'Prompt copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([promptText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.prompt.nome_prompt || 'prompt'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.prompt.nome_prompt || 'prompt'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Preview e Exportar</h2>
        <p className="text-sm text-muted-foreground">
          Visualize e exporte o prompt gerado
        </p>
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="raw" className="gap-2">
            <Code className="w-4 h-4" />
            Código Raw
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2" disabled>
            <MessageSquare className="w-4 h-4" />
            Testar IA
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="mt-4">
          <ScrollArea className="h-[500px] rounded-lg border bg-card p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{promptText}</ReactMarkdown>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="raw" className="mt-4">
          <ScrollArea className="h-[500px] rounded-lg border bg-muted/50 p-4">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {promptText}
            </pre>
          </ScrollArea>
          
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleDownloadMd}>
              <Download className="w-4 h-4 mr-2" />
              Baixar .md
            </Button>
            <Button variant="outline" onClick={handleDownloadJson}>
              <Download className="w-4 h-4 mr-2" />
              Baixar .json
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="test" className="mt-4">
          <div className="h-[500px] rounded-lg border bg-muted/20 flex items-center justify-center">
            <p className="text-muted-foreground">
              Funcionalidade de teste em breve...
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
