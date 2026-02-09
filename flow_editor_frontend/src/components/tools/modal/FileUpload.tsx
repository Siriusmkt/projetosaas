import { useState, useCallback } from 'react';
import { Upload, X, FileText, Video, Image, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  label: string;
  accept: string;
  maxSizeMB: number;
  currentUrl?: string;
  onUpload: (url: string, fileName?: string) => void;
  onRemove: () => void;
  previewType: 'video' | 'image' | 'audio' | 'file';
}

export function FileUpload({
  label,
  accept,
  maxSizeMB,
  currentUrl,
  onUpload,
  onRemove,
  previewType,
}: FileUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    // Validate size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: 'Arquivo muito grande',
        description: `O arquivo deve ter no máximo ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    // Validate type
    const acceptTypes = accept.split(',');
    if (!acceptTypes.some(t => file.type.match(t.trim().replace('*', '.*')))) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo no formato correto.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `demo/${Date.now()}.${fileExt}`;

      // Simular progresso (Supabase não tem callback de progresso)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('tool-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('tool-assets')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      onUpload(urlData.publicUrl, file.name);

      toast({
        title: 'Upload concluído!',
        description: 'O arquivo foi carregado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [accept, maxSizeMB, onUpload, toast]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const renderPreview = () => {
    if (!currentUrl) return null;

    switch (previewType) {
      case 'video':
        return (
          <video 
            src={currentUrl} 
            controls 
            className="w-full max-h-48 rounded-lg bg-background"
          />
        );
      case 'image':
        return (
          <img 
            src={currentUrl} 
            alt="Preview" 
            className="w-full max-h-48 object-contain rounded-lg bg-background"
          />
        );
      case 'audio':
        return (
          <audio src={currentUrl} controls className="w-full" />
        );
      case 'file':
        return (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-sm truncate flex-1">{currentUrl.split('/').pop()}</span>
          </div>
        );
    }
  };

  const getIcon = () => {
    switch (previewType) {
      case 'video': return Video;
      case 'image': return Image;
      case 'audio': return Mic;
      default: return FileText;
    }
  };

  const Icon = getIcon();

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {currentUrl ? (
        <div className="space-y-3">
          {renderPreview()}
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onRemove}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Remover arquivo
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
            ${dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-secondary/50'
            }
            ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {isUploading ? (
            <div className="space-y-3">
              <Upload className="h-8 w-8 mx-auto text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground">Enviando...</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          ) : (
            <>
              <Icon className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">
                Arraste e solte ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máximo {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
