'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: (name: string) => void;
}

export function ProfileDialog({ open, onOpenChange, onProfileUpdated }: ProfileDialogProps) {
  const [name, setName] = useState('Dr. Membro');
  const [email, setEmail] = useState('membro@flegon.com');
  const [planType, setPlanType] = useState('premium');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFeedback(null);
      return;
    }

    async function loadUserData() {
      setIsLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user) {
          if (user.email) setEmail(user.email);

          const { data: profile } = await supabase
            .from('users')
            .select('name, email, plan_type')
            .eq('id', user.id)
            .single();

          if (profile) {
            if (profile.name) setName(profile.name);
            if (profile.email) setEmail(profile.email);
            if (profile.plan_type) setPlanType(profile.plan_type);
          }
        }
      } catch {
        // Fallback local caso offline
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (user) {
        await supabase
          .from('users')
          .update({ name: name.trim() })
          .eq('id', user.id);
      }

      if (onProfileUpdated) {
        onProfileUpdated(name.trim());
      }

      setFeedback('Perfil atualizado com sucesso.');
      setTimeout(() => {
        setFeedback(null);
        onOpenChange(false);
      }, 1200);
    } catch {
      setFeedback('Não foi possível salvar as alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#172127] border-[#695C49]/40 text-[#F5F3EF] p-7">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[8px] tracking-[0.3em] uppercase border-[#695C49]/60 bg-[#1D292F] text-[#E9DDC9]">
              Credencial Médica
            </Badge>
          </div>
          <DialogTitle className="font-serif text-2xl font-medium text-[#F5F3EF]">
            Meu Perfil
          </DialogTitle>
          <DialogDescription className="text-xs text-[#A6ACAF]">
            Informações cadastrais vinculadas à Mentoria Dr. Flegon David.
          </DialogDescription>
        </DialogHeader>

        {/* Status da Mentoria / Plano */}
        <div className="p-3.5 rounded-xl bg-[#1D292F]/80 border border-[#695C49]/30 flex items-center justify-between mt-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#BFA783]/10 border border-[#BFA783]/30 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-[#BFA783]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#E9DDC9] uppercase tracking-wider">
                Mentoria Body Sculpt
              </p>
              <p className="text-[9px] text-[#A6ACAF]">Status: Membro Ativo</p>
            </div>
          </div>
          <Badge variant="premium" className="text-[8px] tracking-wider uppercase font-semibold">
            {planType.toUpperCase()}
          </Badge>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Informação 1: Nome Completo */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-name" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6ACAF]">
              Nome Completo
            </Label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6ACAF]/60 group-focus-within:text-[#BFA783] transition-colors" />
              <Input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading || isSaving}
                className="pl-11 h-11 border-[#695C49]/40 bg-[#1D292F] focus-visible:border-[#BFA783] text-sm text-[#F5F3EF]"
              />
            </div>
          </div>

          {/* Informação 2: E-mail de Acesso */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-email" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6ACAF]">
              E-mail de Acesso
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6ACAF]/60" />
              <Input
                id="profile-email"
                type="email"
                value={email}
                readOnly
                disabled
                className="pl-11 h-11 border-[#695C49]/30 bg-[#1D292F]/50 text-[#A6ACAF] cursor-not-allowed text-sm select-all"
              />
            </div>
            <p className="text-[9px] text-[#A6ACAF]/70 italic px-1">
              O e-mail é vinculado à sua autenticação e não pode ser alterado diretamente.
            </p>
          </div>

          {feedback && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#BFA783]/10 border border-[#BFA783]/30 text-[#E9DDC9] text-xs justify-center font-medium animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-[#BFA783]" />
              <span>{feedback}</span>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs uppercase tracking-wider h-10 px-5"
            >
              Fechar
            </Button>
            <Button
              type="submit"
              variant="premium"
              disabled={isLoading || isSaving}
              className="text-xs font-semibold uppercase tracking-wider h-10 px-6"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
