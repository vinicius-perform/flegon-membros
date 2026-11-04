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

export function CreateModuleDialog() {
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

      setSuccessMSG('Módulo criado com sucesso!');
      setTimeout(() => {
        handleOpenChange(false);
        router.refresh();
      }, 1000);

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
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
             <AlertCircle className="h-4 w-4 shrink-0" />
             <span>{errorMSG}</span>
          </div>
        )}

        {successMSG && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#BFA783]/20 border border-[#BFA783]/40 text-[#E9DDC9] text-xs">
             <CheckCircle2 className="h-4 w-4 shrink-0 text-[#BFA783]" />
             <span>{successMSG}</span>
          </div>
        )}

        <div className="grid gap-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-[#A6ACAF]">
              Título do Módulo <span className="text-[#BFA783]">*</span>
            </Label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Módulo 1: Introdução"
              disabled={isLoading || !!successMSG}
              className="bg-[#1D292F] border-[#695C49]/40 text-[#F5F3EF] placeholder:text-[#A6ACAF]/50 h-11" 
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-[#A6ACAF]">Descrição Curta (Opcional)</Label>
            <Input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre o que é este módulo..."
              disabled={isLoading || !!successMSG}
              className="bg-[#1D292F] border-[#695C49]/40 text-[#F5F3EF] placeholder:text-[#A6ACAF]/50 h-11" 
            />
          </div>

          <div className="grid grid-cols-1 gap-4 mt-1">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-[#A6ACAF]">Capa do Módulo (Horizontal)</Label>
              <div 
                onClick={() => !isLoading && bannerInputRef.current?.click()}
                className={`aspect-[21/9] w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all relative group cursor-pointer overflow-hidden ${
                  isLoading
                    ? 'opacity-50'
                    : 'bg-[#0A1115]/80 border-[#695C49]/40 hover:border-[#BFA783]/60 hover:bg-[#1D292F]/60'
                }`}
              >
                {bannerFile ? (
                   <img src={URL.createObjectURL(bannerFile)} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                ) : (
                   <>
                     <div className="h-12 w-12 bg-[#1D292F] rounded-full flex items-center justify-center border border-[#695C49]/40 group-hover:border-[#BFA783]/60 transition-all">
                       <ImageIcon className="h-6 w-6 text-[#BFA783] group-hover:scale-110 transition-transform" />
                     </div>
                     <span className="text-xs text-center text-[#A6ACAF] tracking-wide">
                       Clique ou arraste uma imagem (1920x800px)
                     </span>
                   </>
                )}
              </div>
              <input type="file" ref={bannerInputRef} onChange={(e) => setBannerFile(e.target.files?.[0] || null)} accept="image/*" className="hidden" />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-4 border-t border-[#695C49]/20 pt-4">
          <Button variant="ghost" disabled={isLoading} className="text-[#A6ACAF] hover:text-[#F5F3EF] hover:bg-[#1D292F]" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !!successMSG} variant="premium" className="uppercase tracking-widest text-xs px-6">
            {isLoading ? 'Criando...' : 'Criar Módulo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
