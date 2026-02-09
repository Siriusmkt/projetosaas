import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIFlowSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateFlow: (prompt: string) => void;
  isGenerating: boolean;
}

export function AIFlowSidebar({
  open,
  onOpenChange,
  onGenerateFlow,
  isGenerating,
}: AIFlowSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Descreva o fluxo que deseja criar.' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    onGenerateFlow(userMessage);

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant', content: '✓ Fluxo gerado!' }]);
    }, 1500);
  };

  if (!open) return null;

  return (
    <div className="fixed right-0 top-12 bottom-0 w-72 border-l bg-background flex flex-col z-40 shadow-lg">
      <div className="h-10 border-b flex items-center justify-between px-3">
        <span className="text-sm font-medium">IA</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onOpenChange(false)}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'text-sm rounded-lg px-2.5 py-1.5',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-4'
                  : 'bg-muted mr-4'
              )}
            >
              {msg.content}
            </div>
          ))}
          {isGenerating && (
            <div className="bg-muted rounded-lg px-2.5 py-1.5 mr-4 flex items-center gap-1.5 text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              Gerando...
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-2 border-t flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva o fluxo..."
          disabled={isGenerating}
          className="h-8 text-sm"
        />
        <Button type="submit" size="icon" className="h-8 w-8" disabled={isGenerating || !input.trim()}>
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </Button>
      </form>
    </div>
  );
}
