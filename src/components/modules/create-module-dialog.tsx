'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Image as ImageIcon, Plus } from 'lucide-react';
import { uploadImageFile } from '@/lib/upload-helper';
import { createModuleAction } from '@/app/admin/modules/actions';

interface CreateModuleDialogProps {
  onSuccess?: (newModule: any) => void;
}

export function CreateModuleDialog({ onSuccess }: CreateModuleDialogProps = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Files
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);
  const [successMSG, setSuccessMSG] = useState<string | null>(null);

  // File Inputs
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (isLoading) return;
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setBannerFile(null);
    setErrorMSG(null);
    setSuccessMSG(null);
  };

  const handleSave = async () => {
    setErrorMSG(null);
    setSuccessMSG(null);
    if (!title.trim()) {
      setErrorMSG('O título do módulo é obrigatório.');
      return;
    }

    setIsLoading(true);

    try {
      let finalBanner: string | null = null;

      if (bannerFile) {
        finalBanner = await uploadImageFile(bannerFile, 'banners');
      }

      const res = await createModuleAction({
        title,
        description,
        bannerUrl: finalBanner,
      });

      if (!res.success) {
        throw new Error('Falha ao registrar novo módulo.');
      }

      if (res.module && onSuccess) {
        onSuccess(res.module);
      }

      setSuccessMSG('Módulo criado com sucesso!');
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
      <DialogTrigger render={
        <Button variant="premium" className="font-semibold uppercase tracking-widest text-xs px-5 shadow-[0_4px_20px_rgba(191,167,131,0.25)]">
          <Plus className="mr-2 h-4 w-4" /> Novo Módulo
        </Button>
      } />
      
      <DialogContent className="sm:max-w-[700px] border-[#695C49]/40 bg-[#172127]/95 backdrop-blur-2xl text-[#F5F3EF] shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-[#695C49]/20 pb-4">
          <DialogTitle className="text-2xl font-serif text-[#F5F3EF]">Criar Novo Módulo</DialogTitle>
          <DialogDescription className="text-[#A6ACAF] text-xs">
            Adicione um novo módulo na plataforma. Preencha as capas para exibi-las na Home.
          </DialogDescription>
        </DialogHeader>

        {errorMSG && (
          <div className="flex items-center gap-2 p-3 rounded-lg overflow-hidden bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
             <AlertCircle className="h-4 w-4 shrink-0" />
             <span>{errorMSG}</span>
          </div>
        )}

        {successMSG && (
          <div className="flex items-center gap-2 p-3 rounded-lg overflow-hidden bg-primary/10 border border-primary/20 text-primary text-sm">
             <CheckCircle2 className="h-4 w-4 shrink-0" />
             <span>{successMSG}</span>
          </div>
        )}

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-zinc-300">Título do Módulo <span className="text-red-500">*</span></Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Módulo 1: Fundamentos da Lipo HD" 
              disabled={isLoading || !!successMSG}
              className="bg-black/40 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-zinc-600 h-10" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc" className="text-zinc-300">Descrição Curta (Opcional)</Label>
            <Input 
              id="desc" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Sobre o que é este módulo..." 
              disabled={isLoading || !!successMSG}
              className="bg-black/40 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-zinc-600 h-10" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Capa do Módulo (Horizontal)</Label>
            <div 
              onClick={() => !isLoading && !successMSG && bannerInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-black/20 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden group"
            >
              {bannerFile ? (
                <div className="relative w-full h-[140px] rounded-lg overflow-hidden">
                  <img src={URL.createObjectURL(bannerFile)} alt="Preview Horizontal" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-xs text-white uppercase tracking-widest font-medium">Trocar Imagem</span>
                  </div>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-6 w-6 text-zinc-500 mb-2 group-hover:text-primary transition-colors" />
                  <span className="text-xs text-zinc-400">Clique para selecionar imagem (1920x1080)</span>
                </>
              )}
            </div>
            <input 
              ref={bannerInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => setBannerFile(e.target.files?.[0] || null)} 
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" disabled={isLoading} className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl px-6" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !!successMSG} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-6 transition-all shadow-[0_4px_20px_0_rgba(212,175,55,0.4)]"
          >
            {isLoading ? 'Criando...' : 'Criar Módulo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
