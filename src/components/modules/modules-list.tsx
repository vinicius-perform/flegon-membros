'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, Plus, Video, Edit2, Archive, Trash2, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { EditModuleDialog } from './edit-module-dialog';
import { CreateModuleDialog } from './create-module-dialog';
import { CreateLessonDialog } from './create-lesson-dialog';
import { EditLessonDialog } from './edit-lesson-dialog';

export function ModulesList({ modules }: { modules: any[] }) {
  const router = useRouter();
  
  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [creatingLessonFor, setCreatingLessonFor] = useState<any | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [isDeletingLesson, setIsDeletingLesson] = useState<string | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState<string | null>(null);

  const handleArchive = async (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente arquivar este módulo? Ele sumirá da área de membros e dessa tela.')) return;
    
    setIsArchiving(moduleId);
    try {
      const { error } = await supabase.from('modules').update({ status: 'archived' }).eq('id', moduleId);
      if (error) throw error;
      router.refresh(); 
    } catch (err: any) {
      alert(`Erro ao arquivar: ${err.message}`);
    } finally {
      setIsArchiving(null);
    }
  };

  const handleRestore = async (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('modules').update({ status: 'active' }).eq('id', moduleId);
      if (error) throw error;
      router.refresh(); 
    } catch (err: any) {
      alert(`Erro ao restaurar: ${err.message}`);
    }
  };

  const handleDeleteModule = async (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    if (!confirm('ATENÇÃO: Deseja realmente EXCLUIR PERMANENTEMENTE este módulo e todas as suas aulas? Esta ação é irreversível e apagará os arquivos em cascata (caso configurado no banco).')) return;
    
    setIsDeletingModule(moduleId);
    try {
      const { error } = await supabase.from('modules').delete().eq('id', moduleId);
      if (error) throw error;
      router.refresh(); 
    } catch (err: any) {
      alert(`Erro ao excluir permanentemente: ${err.message}`);
    } finally {
      setIsDeletingModule(null);
    }
  };

  const handleEdit = (e: React.MouseEvent, module: any) => {
    e.stopPropagation();
    setEditingModule(module);
  };

  const handleAddLesson = (e: React.MouseEvent, module: any) => {
    e.stopPropagation();
    setCreatingLessonFor(module);
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Deseja realmente excluir permanentemente esta aula? A ação não pode ser desfeita.')) return;
    
    setIsDeletingLesson(lessonId);
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
      if (error) throw error;
      router.refresh(); 
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    } finally {
      setIsDeletingLesson(null);
    }
  };

  const activeModules = modules
    .filter((m: any) => m.status !== 'archived')
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const archivedModules = modules
    .filter((m: any) => m.status === 'archived')
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <FolderOpen className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Arquitetura de Ensino</span>
          </div>
          <h2 className="text-4xl font-heading font-bold tracking-tight text-white uppercase">Gestão de Conteúdo</h2>
          <p className="text-zinc-500 text-sm mt-1">Estruturação e curadoria dos módulos Flegon Members.</p>
        </div>
        <CreateModuleDialog />
      </div>

      {activeModules.length === 0 ? (
        <Card className="bg-black/40 border-white/5 backdrop-blur-3xl shadow-2xl">
          <CardContent className="p-20 text-center flex flex-col items-center">
            <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10 mb-6">
               <FolderOpen className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-2xl font-heading font-medium text-white mb-2 uppercase tracking-tight">Acervo Vazio</h3>
            <p className="text-zinc-500 max-w-sm mx-auto leading-relaxed text-sm">Inicie a construção da sua área de membros criando o primeiro módulo estratégico.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Accordion multiple defaultValue={activeModules.map((m: any) => m.id)} className="space-y-6">
            {activeModules.map((module: any) => (
              <AccordionItem 
                key={module.id} 
                value={module.id}
                className={`border border-white/5 rounded-2xl bg-black/40 backdrop-blur-2xl overflow-hidden transition-all duration-500 ${isArchiving === module.id ? 'opacity-50 pointer-events-none' : 'hover:border-primary/20'}`}
              >
                <AccordionTrigger className="hover:no-underline px-6 py-6 group">
                  <div className="flex items-center w-full pr-4 text-left">
                    <div className="flex flex-row items-center gap-6 min-w-0 flex-1">
                      <div className="h-10 w-6 flex items-center justify-center border-r border-white/5 pr-4">
                         <GripVertical className="h-4 w-4 text-zinc-700 group-hover:text-primary transition-colors cursor-grab" />
                      </div>
                      
                      <div className="h-16 w-12 relative flex-shrink-0 rounded-xl overflow-hidden bg-black/50 border border-white/5 shadow-inner">
                         {module.cover_image_vertical ? (
                            <img src={module.cover_image_vertical} alt={module.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                         ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-primary/20 bg-gradient-to-br from-white/5 to-transparent"><FolderOpen className="h-5 w-5" /></div>
                         )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-heading font-bold text-white text-lg block tracking-tight uppercase group-hover:text-primary transition-colors truncate max-w-[480px]" title={module.title}>{module.title}</span>
                        {module.description && <span className="text-xs text-zinc-500 block truncate font-medium mt-1 uppercase tracking-widest max-w-[600px]" title={module.description}>{module.description}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 ml-auto">
                      <Badge variant="outline" className="h-7 px-3 border-white/10 text-zinc-400 bg-white/5 font-bold tracking-widest text-[9px]">
                        {module.lessons?.length || 0} CONTEÚDOS
                      </Badge>
                      <div className="flex items-center gap-2 transition-all duration-300">
                         <Button onClick={(e) => handleEdit(e, module)} disabled={isArchiving === module.id} variant="glass" size="icon" className="h-9 w-9">
                           <Edit2 className="h-4 w-4" />
                         </Button>
                         <Button onClick={(e) => handleArchive(e, module.id)} disabled={isArchiving === module.id} variant="glass" size="icon" className="h-9 w-9 text-zinc-500 hover:text-destructive">
                           <Archive className="h-4 w-4" />
                         </Button>
                         <Button onClick={e => handleAddLesson(e, module)} size="sm" variant="premium" className="h-9 ml-2 text-[10px] font-bold tracking-widest">
                           <Plus className="mr-1 h-3.5 w-3.5" /> NOVA AULA
                         </Button>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-6 px-10">
                  <div className="space-y-3 mt-4 pl-12 border-l border-white/5">
                    {(!module.lessons || module.lessons.length === 0) ? (
                      <div className="p-8 rounded-xl border border-dashed border-white/5 bg-white/[0.01] text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] text-center">Aguardando inserção de conteúdos pedagógicos...</div>
                    ) : (
                      module.lessons.sort((a: any,b: any) => (a.order||0) - (b.order||0)).map((lesson: any, i: number) => (
                        <motion.div 
                          key={lesson.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-primary/20 hover:bg-white/[0.04] transition-all group/item"
                        >
                          <div className="flex items-center gap-5">
                            <span className="text-[10px] font-bold text-zinc-700 w-4">{String(i + 1).padStart(2, '0')}</span>
                            <div className="h-10 w-10 rounded-lg bg-black/40 flex shrink-0 items-center justify-center border border-white/5 group-hover/item:border-primary/30 transition-all">
                              <Video className="h-4 w-4 text-zinc-500 group-hover/item:text-primary transition-colors" />
                            </div>
                            <div className="min-w-0 flex flex-col items-start gap-1">
                              <p className="font-bold text-white text-xs flex items-center gap-3 tracking-wide w-full overflow-hidden">
                                <span className="truncate max-w-[400px]" title={lesson.title}>{lesson.title}</span>
                                {lesson.is_premium && (
                                  <Badge variant="premium" className="h-4 px-2 text-[8px] tracking-[0.2em] shrink-0">PREMIUM</Badge>
                                )}
                              </p>
                              <p className="text-[9px] text-zinc-600 truncate font-medium uppercase tracking-widest" title={lesson.video_url}>{lesson.video_url}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 transition-opacity">
                            <Button onClick={() => handleEditLesson(lesson)} disabled={isDeletingLesson === lesson.id} variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button onClick={() => handleDeleteLesson(lesson.id)} disabled={isDeletingLesson === lesson.id} variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {archivedModules.length > 0 && (
        <div className="space-y-6 pt-12 border-t border-white/5">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5">
                <Archive className="h-5 w-5 text-zinc-600" />
             </div>
             <div>
                <h3 className="text-lg font-heading font-medium text-white uppercase tracking-tight">Cofre de Arquivos</h3>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Conteúdos offline ou obsoletos</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {archivedModules.map((module: any) => (
                <div key={module.id} className="flex items-center justify-between p-5 bg-black/60 border border-white/5 rounded-2xl group/archived">
                   <div className="flex items-center gap-5">
                      <div className="h-12 w-10 relative flex-shrink-0 rounded-lg overflow-hidden bg-black/50 border border-white/5 grayscale opacity-30">
                         {module.cover_image_vertical && <img src={module.cover_image_vertical} alt={module.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />}
                      </div>
                      <div>
                         <span className="font-bold text-zinc-500 block text-xs uppercase tracking-wide">{module.title}</span>
                         <span className="text-[9px] text-zinc-700 block font-bold uppercase tracking-[0.2em] mt-1">{module.lessons?.length || 0} Conteúdos</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <Button onClick={(e) => handleRestore(e, module.id)} variant="glass" size="sm" className="h-9 px-4 text-[9px] font-bold tracking-widest uppercase">
                         Restaurar
                      </Button>
                      <Button onClick={(e) => handleDeleteModule(e, module.id)} disabled={isDeletingModule === module.id} variant="ghost" size="icon" className="h-9 w-9 text-zinc-700 hover:text-destructive" title="Excluir Permanentemente">
                         {isDeletingModule === module.id ? <Trash2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Modais Anexadas */}
      {editingModule && (
        <EditModuleDialog 
          module={editingModule} 
          open={!!editingModule} 
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingModule(null);
          }} 
        />
      )}

      {creatingLessonFor && (
        <CreateLessonDialog 
          module={creatingLessonFor}
          open={!!creatingLessonFor}
          onOpenChange={(isOpen) => {
             if (!isOpen) setCreatingLessonFor(null);
          }}
        />
      )}

      {editingLesson && (
        <EditLessonDialog
          lesson={editingLesson}
          open={!!editingLesson}
          onOpenChange={(isOpen) => {
             if (!isOpen) setEditingLesson(null);
          }}
        />
      )}
    </div>
  );
}
