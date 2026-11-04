'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { createLessonAction } from '@/app/admin/modules/actions';

interface CreateLessonDialogProps {
  module: any; 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newLesson: any) => void;
}

export function CreateLessonDialog({ module, open, onOpenChange, onSuccess }: CreateLessonDialogProps) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [premiumStartDate, setPremiumStartDate] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);
  const [successMSG, setSuccessMSG] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setVideoUrl('');
    setIsPremium(false);
    setPremiumStartDate('');
    setReleaseDate('');
    setAttachments([]);
    setErrorMSG(null);
    setSuccessMSG(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isLoading) return;
    onOpenChange(isOpen);
    if (!isOpen) resetForm();
  };

  const handleSave = async () => {
    setErrorMSG(null);
    setSuccessMSG(null);

    if (!title.trim()) {
      setErrorMSG('O título da aula é obrigatório.');
      return;
    }
    if (!videoUrl.trim()) {
      setErrorMSG('A URL do vídeo é obrigatória.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await createLessonAction({
        moduleId: String(module.id),
        title,
        videoUrl,
        isPremium,
        premiumStartDate: isPremium ? (premiumStartDate ? new Date(premiumStartDate + 'T00:00:00').toISOString() : null) : null,
        releaseDate: releaseDate ? new Date(releaseDate + 'T00:00:00').toISOString() : null,
        attachments,
      });

      if (!res.success) {
        throw new Error('Falha ao registrar aula no módulo.');
      }

      if (res.lesson && onSuccess) {
        onSuccess(res.lesson);
      }

      setSuccessMSG('Aula criada com sucesso!');
      
      setTimeout(() => {
        handleOpenChange(false);
        router.refresh();
      }, 500);

    } catch (err: any) {
      setErrorMSG(err.message || 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px] border-[#695C49]/40 bg-[#172127]/95 backdrop-blur-2xl text-[#F5F3EF] shadow-2xl">
        <DialogHeader className="border-b border-[#695C49]/20 pb-4">
          <DialogTitle className="text-2xl font-serif text-[#F5F3EF]">Adicionar Aula</DialogTitle>
          <DialogDescription className="text-[#A6ACAF] text-xs">
            Inserindo nova aula no módulo <span className="text-[#BFA783] font-medium">{module?.title}</span>.
          </DialogDescription>
        </DialogHeader>

        {errorMSG && (
          <div className="flex items-center gap-2 p-3 rounded-lg overflow-hidden bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
             <AlertCircle className="h-4 w-4 shrink-0" />
             <span>{errorMSG}</span>
          </div>
        )}

        {successMSG && (
          <div className="flex items-center gap-2 p-3 rounded-lg overflow-hidden bg-[#BFA783]/20 border border-[#BFA783]/40 text-[#E9DDC9] text-xs">
             <CheckCircle2 className="h-4 w-4 shrink-0 text-[#BFA783]" />
             <span>{successMSG}</span>
          </div>
        )}

        <div className="grid gap-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-[#A6ACAF]">Título da Aula <span className="text-[#BFA783]">*</span></Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Anatomia Topográfica e Marcações" 
              disabled={isLoading || !!successMSG}
              className="bg-[#1D292F] border-[#695C49]/40 text-[#F5F3EF] h-10" 
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="video_url" className="text-xs uppercase tracking-wider text-[#A6ACAF]">YouTube Video ID ou URL <span className="text-[#BFA783]">*</span></Label>
            <Input 
              id="video_url" 
              value={videoUrl} 
              onChange={(e) => setVideoUrl(e.target.value)} 
              placeholder="Ex: dQw4w9WgXcQ ou https://youtu.be/..." 
              disabled={isLoading || !!successMSG}
              className="bg-[#1D292F] border-[#695C49]/40 text-[#F5F3EF] h-10" 
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="release_date" className="text-xs uppercase tracking-wider text-[#A6ACAF]">Data de Estreia (Opcional)</Label>
            <Input 
              id="release_date" 
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              disabled={isLoading || !!successMSG}
              className="bg-[#1D292F] border-[#695C49]/40 text-[#F5F3EF] h-10 w-full cursor-pointer" 
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="is_premium" 
                checked={isPremium} 
                onChange={(e) => {
                  setIsPremium(e.target.checked);
                  if (!e.target.checked) setPremiumStartDate('');
                }}
                className="w-4 h-4 rounded border-[#695C49]/40 bg-[#1D292F] accent-[#BFA783]"
              />
              <Label htmlFor="is_premium" className="text-[#F5F3EF] font-medium cursor-pointer text-sm">
                Aula Exclusiva Premium
              </Label>
            </div>
            
            {isPremium && (
              <div className="space-y-2 mt-2 pl-6 border-l-2 border-[#BFA783]/40">
                <Label htmlFor="premium_start_date" className="text-xs text-[#A6ACAF]">Data de ativação do Premium</Label>
                <Input 
                  id="premium_start_date" 
                  type="date"
                  value={premiumStartDate}
                  onChange={(e) => setPremiumStartDate(e.target.value)}
                  disabled={isLoading || !!successMSG}
                  className="bg-[#1D292F] border-[#695C49]/40 text-[#F5F3EF] h-10 w-full cursor-pointer" 
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-4 border-t border-[#695C49]/20 pt-4">
          <Button variant="ghost" disabled={isLoading} className="text-[#A6ACAF] hover:text-[#F5F3EF] hover:bg-[#1D292F]" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !!successMSG} 
            variant="premium"
            className="uppercase tracking-widest text-xs px-6"
          >
            {isLoading ? 'Adicionando...' : 'Adicionar Aula'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
