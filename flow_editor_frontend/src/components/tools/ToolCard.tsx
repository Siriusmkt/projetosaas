import { useState } from 'react';
import { MoreHorizontal, Pencil, Copy, Trash2 } from 'lucide-react';
import { Tool, getToolTypeInfo } from '@/types/tools';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ToolIcon } from './ToolIcon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ToolCardProps {
  tool: Tool;
  onEdit: (tool: Tool) => void;
  onDuplicate: (tool: Tool) => void;
  onDelete: (tool: Tool) => void;
  onToggleStatus: (toolId: string, isActive: boolean) => void;
}

export function ToolCard({ tool, onEdit, onDuplicate, onDelete, onToggleStatus }: ToolCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const typeInfo = getToolTypeInfo(tool.tool_type);

  const handleToggle = () => {
    onToggleStatus(tool.id, !tool.is_active);
  };

  return (
    <>
      <Card className="group bg-card border-border hover:border-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div 
                className="p-3 rounded-xl flex-shrink-0"
                style={{ backgroundColor: `${typeInfo.color}20` }}
              >
                <ToolIcon type={tool.tool_type} className="w-6 h-6" style={{ color: typeInfo.color }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {tool.display_name}
                  </h3>
                  <Badge 
                    variant={tool.is_active ? 'default' : 'secondary'}
                    className={tool.is_active 
                      ? 'bg-success/20 text-success border-success/30 hover:bg-success/30' 
                      : 'bg-muted text-muted-foreground'
                    }
                  >
                    {tool.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {typeInfo.label}
                </p>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {tool.ai_description}
                </p>
                
                <p className="text-xs text-muted-foreground mt-3">
                  Criada em {format(new Date(tool.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch
                checked={tool.is_active}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-success"
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                  <DropdownMenuItem onClick={() => onEdit(tool)} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(tool)} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)} 
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tool</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{tool.display_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary hover:bg-secondary/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(tool)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
