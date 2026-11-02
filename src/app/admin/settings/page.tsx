'use client';

import { Settings, Save, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function AdminSettings() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Settings className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Infraestrutura & Core</span>
          </div>
          <h2 className="text-4xl font-heading font-bold tracking-tight text-white uppercase">Parâmetros Globais</h2>
          <p className="text-zinc-500 text-sm mt-1">Configurações críticas de sistema e chaves de integração.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="glass" size="sm" className="text-[10px] tracking-widest font-bold">REVERSÃO</Button>
           <Button onClick={handleSave} variant="premium" className="h-10 text-[10px] font-bold tracking-widest uppercase px-6">
             <Save className="w-4 h-4 mr-2" />
             CONSOLIDAR AJUSTES
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="md:col-span-2 space-y-8">
            <Card className="bg-black/40 border-white/5 backdrop-blur-2xl overflow-hidden shadow-2xl">
               <CardHeader className="border-b border-white/5 bg-white/[0.01] p-6">
                  <CardTitle className="text-white font-heading font-medium uppercase tracking-tight text-sm">Identidade Institucional</CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Nome de Exibição</Label>
                        <Input defaultValue="FLEGON MEMBERS" className="bg-white/[0.03] border-white/10 text-sm h-12 uppercase tracking-wide font-medium" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Email de Governança</Label>
                        <Input defaultValue="suporte@flegondavid.com.br" className="bg-white/[0.03] border-white/10 text-sm h-12 font-medium" />
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-black/40 border-white/5 backdrop-blur-2xl overflow-hidden shadow-2xl">
               <CardHeader className="border-b border-white/5 bg-white/[0.01] p-6">
                  <CardTitle className="text-white font-heading font-medium uppercase tracking-tight text-sm">Segurança de Dados (Supabase)</CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Endpoint de Conexão</Label>
                        <div className="relative group">
                           <Input type="password" defaultValue="************************" className="bg-white/[0.03] border-white/10 text-zinc-500 text-xs h-12 font-medium pr-12" />
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                              <LinkIcon className="h-4 w-4 text-zinc-500" />
                           </div>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[10px) font-bold text-zinc-600 uppercase tracking-widest px-1">Chave Pública (Anon Key)</Label>
                        <Input type="password" defaultValue="********************************************************" className="bg-white/[0.03] border-white/10 text-zinc-500 text-xs h-12 font-medium" />
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="bg-[#172127]/60 border-primary/20 backdrop-blur-3xl p-8 space-y-6">
               <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Settings className="h-7 w-7 text-primary" />
               </div>
               <div>
                  <h4 className="text-lg font-heading font-medium text-white uppercase tracking-tight mb-2">Modo de Manutenção</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium">Bloqueie o acesso de alunos para atualizações críticas de infraestrutura.</p>
               </div>
               <Button variant="outline" className="w-full h-12 text-[10px] font-bold tracking-widest border-white/10 hover:bg-white/5 uppercase">ATIVAR PROTOCOLO</Button>
            </Card>

            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Versionamento</p>
               <div className="flex items-end justify-between">
                  <p className="text-2xl font-heading font-bold text-white uppercase tracking-tight">V3.4.0</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 italic">Stable Build</p>
               </div>
               <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] text-zinc-600 font-medium">Desenvolvido sob o padrão Flegon Members Identity 2026.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
