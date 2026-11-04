'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GripVertical,
  Plus,
  Video,
  Edit2,
  Archive,
  Trash2,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditModuleDialog } from './edit-module-dialog';
import { CreateModuleDialog } from './create-module-dialog';
import { CreateLessonDialog } from './create-lesson-dialog';
import { EditLessonDialog } from './edit-lesson-dialog';
import {
  archiveModuleAction,
  deleteModuleAction,
  deleteLessonAction,
} from '@/app/admin/modules/actions';

export function ModulesList({ modules }: { modules: any[] }) {
  const router = useRouter();

  // Optimistic UI local state
  const [moduleList, setModuleList] = useState<any[]>(modules || []);
  useEffect(() => {
    setModuleList(modules || []);
  }, [modules]);

  // Collapsed / Expanded state per module (all expanded by default)
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  const isModuleOpen = (moduleId: string) => !collapsedMap[moduleId];
  const toggleModule = (moduleId: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [creatingLessonFor, setCreatingLessonFor] = useState<any | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [isDeletingLesson, setIsDeletingLesson] = useState<string | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState<string | null>(null);

  const handleArchive = async (moduleId: string) => {
    if (!confirm('Deseja realmente arquivar este módulo? Ele sumirá da área de membros dos alunos.')) return;

    // Optimistic update
    setModuleList((prev) =>
      prev.map((m) => (String(m.id) === String(moduleId) ? { ...m, status: 'archived' } : m))
    );

    setIsArchiving(moduleId);
    try {
      await archiveModuleAction(moduleId, 'archived');
      router.refresh();
    } catch (err: any) {
      alert(`Erro ao arquivar: ${err.message}`);
    } finally {
      setIsArchiving(null);
    }
  };

  const handleRestore = async (moduleId: string) => {
    // Optimistic update
    setModuleList((prev) =>
      prev.map((m) => (String(m.id) === String(moduleId) ? { ...m, status: 'active' } : m))
    );

    try {
      await archiveModuleAction(moduleId, 'active');
      router.refresh();
    } catch (err: any) {
      alert(`Erro ao restaurar: ${err.message}`);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('ATENÇÃO: Deseja realmente EXCLUIR PERMANENTEMENTE este módulo e todas as suas aulas? Esta ação é irreversível.')) return;

    // Optimistic update
    setModuleList((prev) => prev.filter((m) => String(m.id) !== String(moduleId)));

    setIsDeletingModule(moduleId);
    try {
      await deleteModuleAction(moduleId);
      router.refresh();
    } catch (err: any) {
      alert(`Erro ao excluir permanentemente: ${err.message}`);
    } finally {
      setIsDeletingModule(null);
    }
  };

  const handleEdit = (module: any) => {
    setEditingModule(module);
  };

  const handleAddLesson = (module: any) => {
    setCreatingLessonFor(module);
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Deseja realmente excluir permanentemente esta aula? A ação não pode ser desfeita.')) return;

    // Optimistic update
    setModuleList((prev) =>
      prev.map((m) => ({
        ...m,
        lessons: (m.lessons || []).filter((l: any) => String(l.id) !== String(lessonId)),
      }))
    );

    setIsDeletingLesson(lessonId);
    try {
      await deleteLessonAction(lessonId);
      router.refresh();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    } finally {
      setIsDeletingLesson(null);
    }
  };

  const activeModules = moduleList
    .filter((m: any) => m.status !== 'archived')
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const archivedModules = moduleList
    .filter((m: any) => m.status === 'archived')
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header com Botão Novo Módulo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#BFA783] mb-2">
            <FolderOpen className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Arquitetura de Ensino</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-[#F5F3EF]">
            GESTÃO DE CONTEÚDO
          </h2>
          <p className="text-[#A6ACAF] text-xs mt-1">Estruturação e curadoria dos módulos Flegon Members.</p>
        </div>

        <CreateModuleDialog
          onSuccess={(newMod) => {
            setModuleList((prev) => [...prev, newMod]);
          }}
        />
      </div>

      {activeModules.length === 0 ? (
        <Card className="bg-[#172127]/60 border-[#695C49]/30 backdrop-blur-2xl shadow-2xl">
          <CardContent className="p-16 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-[#BFA783]/10 rounded-full flex items-center justify-center border border-[#BFA783]/20 mb-5">
              <FolderOpen className="w-8 h-8 text-[#BFA783]" />
            </div>
            <h3 className="text-xl font-serif font-medium text-[#F5F3EF] mb-2">Acervo Vazio</h3>
            <p className="text-[#A6ACAF] max-w-sm mx-auto leading-relaxed text-xs mb-6">
              Inicie a construção da sua área de membros criando o primeiro módulo estratégico.
            </p>
            <CreateModuleDialog
              onSuccess={(newMod) => {
                setModuleList((prev) => [...prev, newMod]);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeModules.map((module: any) => {
            const isOpen = isModuleOpen(module.id);
            const lessonsCount = module.lessons?.length || 0;

            return (
              <div
                key={module.id}
                className={`border border-[#695C49]/30 rounded-2xl bg-[#172127]/80 backdrop-blur-2xl overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.3)] ${
                  isArchiving === module.id ? 'opacity-50 pointer-events-none' : 'hover:border-[#BFA783]/40'
                }`}
              >
                {/* Module Header Row */}
                <div className="p-5 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 border-b border-[#695C49]/20 bg-[#1D292F]/40">
                  {/* Left: Drag Handle, Thumbnail, Title, Description */}
                  <div
                    onClick={() => toggleModule(module.id)}
                    className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer select-none group/title"
                  >
                    <div className="h-10 w-5 flex items-center justify-center border-r border-[#695C49]/30 pr-3">
                      <GripVertical className="h-4 w-4 text-[#A6ACAF]/40 group-hover/title:text-[#BFA783] transition-colors" />
                    </div>

                    <div className="h-16 w-14 relative shrink-0 rounded-xl overflow-hidden bg-black/60 border border-[#695C49]/40 shadow-md">
                      {module.cover_image_vertical ? (
                        <img
                          src={module.cover_image_vertical}
                          alt={module.title}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover group-hover/title:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#BFA783]/40 bg-gradient-to-br from-white/5 to-transparent">
                          <FolderOpen className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-serif font-medium text-[#F5F3EF] text-lg block tracking-wide group-hover/title:text-[#BFA783] transition-colors truncate max-w-[500px]"
                          title={module.title}
                        >
                          {module.title}
                        </span>
                      </div>
                      {module.description && (
                        <span
                          className="text-xs text-[#A6ACAF] block truncate font-normal mt-0.5 max-w-[600px]"
                          title={module.description}
                        >
                          {module.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Counter Badge, + Nova Aula, Edit, Archive, Collapse Toggle */}
                  <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-end border-t lg:border-t-0 border-[#695C49]/20 pt-3 lg:pt-0">
                    <Badge
                      variant="outline"
                      className="h-8 px-3 border-[#695C49]/40 text-[#E9DDC9] bg-[#0A1115]/50 font-semibold tracking-wider text-[10px] uppercase"
                    >
                      {lessonsCount} {lessonsCount === 1 ? 'CONTEÚDO' : 'CONTEÚDOS'}
                    </Badge>

                    {/* Botão Principal: NOVA AULA */}
                    <Button
                      onClick={() => handleAddLesson(module)}
                      variant="premium"
                      className="h-9 px-4 text-xs font-semibold tracking-wider uppercase shadow-[0_2px_12px_rgba(191,167,131,0.25)] flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>NOVA AULA</span>
                    </Button>

                    {/* Editar Módulo */}
                    <Button
                      onClick={() => handleEdit(module)}
                      disabled={isArchiving === module.id}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-[#695C49]/40 bg-[#0A1115]/40 text-[#A6ACAF] hover:text-[#F5F3EF] hover:border-[#BFA783]/60"
                      title="Editar Módulo"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    {/* Arquivar Módulo */}
                    <Button
                      onClick={() => handleArchive(module.id)}
                      disabled={isArchiving === module.id}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-[#695C49]/40 bg-[#0A1115]/40 text-[#A6ACAF] hover:text-amber-400 hover:border-amber-400/50"
                      title="Arquivar Módulo"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>

                    {/* Toggle Expandir / Recolher */}
                    <Button
                      onClick={() => toggleModule(module.id)}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-[#A6ACAF] hover:text-[#F5F3EF] hover:bg-[#1D292F]"
                      title={isOpen ? 'Recolher aulas' : 'Expandir aulas'}
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Module Body: Lessons List */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 md:p-8 space-y-3 bg-[#0A1115]/30">
                        {(!module.lessons || module.lessons.length === 0) ? (
                          <div className="p-8 rounded-xl border border-dashed border-[#695C49]/30 bg-[#172127]/40 text-center space-y-3">
                            <p className="text-xs text-[#A6ACAF] uppercase tracking-wider font-medium">
                              Nenhuma aula cadastrada ainda neste módulo.
                            </p>
                            <Button
                              onClick={() => handleAddLesson(module)}
                              variant="premium"
                              className="text-xs uppercase tracking-wider px-5 h-9 font-semibold"
                            >
                              <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Primeira Aula
                            </Button>
                          </div>
                        ) : (
                          <>
                            {module.lessons
                              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                              .map((lesson: any, i: number) => (
                                <motion.div
                                  key={lesson.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  className="flex items-center justify-between p-3.5 md:p-4 rounded-xl border border-[#695C49]/25 bg-[#172127]/60 hover:border-[#BFA783]/40 hover:bg-[#1D292F]/80 transition-all group/item shadow-sm"
                                >
                                  <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <span className="text-[10px] font-semibold text-[#A6ACAF] w-5 text-center">
                                      {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <div className="h-9 w-9 rounded-lg bg-[#0A1115] flex shrink-0 items-center justify-center border border-[#695C49]/30 group-hover/item:border-[#BFA783]/50 transition-colors">
                                      <Video className="h-4 w-4 text-[#A6ACAF] group-hover/item:text-[#BFA783] transition-colors" />
                                    </div>
                                    <div className="min-w-0 flex flex-col items-start gap-0.5">
                                      <div className="flex items-center gap-2 max-w-full">
                                        <span
                                          className="font-medium text-[#F5F3EF] text-xs truncate max-w-[340px] md:max-w-[500px]"
                                          title={lesson.title}
                                        >
                                          {lesson.title}
                                        </span>
                                        {lesson.is_premium && (
                                          <Badge
                                            variant="premium"
                                            className="h-4 px-1.5 text-[7px] tracking-wider shrink-0 font-bold"
                                          >
                                            PREMIUM
                                          </Badge>
                                        )}
                                      </div>
                                      <p
                                        className="text-[9px] text-[#A6ACAF]/70 truncate font-mono max-w-[320px] md:max-w-[480px]"
                                        title={lesson.video_url}
                                      >
                                        {lesson.video_url}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                    <Button
                                      onClick={() => handleEditLesson(lesson)}
                                      disabled={isDeletingLesson === lesson.id}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-[#A6ACAF] hover:text-[#F5F3EF] hover:bg-[#0A1115]/50"
                                      title="Editar Aula"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                      disabled={isDeletingLesson === lesson.id}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-[#A6ACAF] hover:text-red-400 hover:bg-red-500/10"
                                      title="Excluir Aula"
                                    >
                                      {isDeletingLesson === lesson.id ? (
                                        <div className="h-3.5 w-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                      )}
                                    </Button>
                                  </div>
                                </motion.div>
                              ))}

                            {/* Botão de Adicionar Aula no Final da Lista */}
                            <div className="pt-2">
                              <Button
                                onClick={() => handleAddLesson(module)}
                                variant="outline"
                                className="w-full h-10 border-dashed border-[#695C49]/40 hover:border-[#BFA783]/60 bg-[#0A1115]/30 hover:bg-[#1D292F] text-[#E9DDC9] text-xs font-semibold uppercase tracking-wider gap-2 transition-all"
                              >
                                <Plus className="h-4 w-4 text-[#BFA783]" />
                                Adicionar Aula neste Módulo
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Seção de Módulos Arquivados */}
      {archivedModules.length > 0 && (
        <div className="space-y-6 pt-10 border-t border-[#695C49]/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-[#172127] rounded-full flex items-center justify-center border border-[#695C49]/30">
              <Archive className="h-4 w-4 text-[#A6ACAF]" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-[#F5F3EF]">Módulos Arquivados</h3>
              <p className="text-[#A6ACAF] text-[10px] uppercase tracking-wider">Conteúdos fora do ar na área do aluno</p>
            </div>
          </div>

          <div className="grid gap-3">
            {archivedModules.map((module: any) => (
              <div
                key={module.id}
                className="flex items-center justify-between p-4 bg-[#172127]/40 border border-[#695C49]/20 rounded-xl"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-9 rounded-lg overflow-hidden bg-black/50 border border-[#695C49]/30 grayscale opacity-40 shrink-0">
                    {module.cover_image_vertical && (
                      <img
                        src={module.cover_image_vertical}
                        alt={module.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-serif font-medium text-xs text-[#A6ACAF] block truncate">
                      {module.title}
                    </span>
                    <span className="text-[10px] text-[#A6ACAF]/50 block">
                      {module.lessons?.length || 0} aulas associadas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleRestore(module.id)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] uppercase tracking-wider border-[#695C49]/40 hover:bg-[#1D292F] text-[#BFA783]"
                  >
                    Restaurar
                  </Button>
                  <Button
                    onClick={() => handleDeleteModule(module.id)}
                    disabled={isDeletingModule === module.id}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#A6ACAF] hover:text-red-400"
                    title="Excluir Permanentemente"
                  >
                    {isDeletingModule === module.id ? (
                      <div className="h-3.5 w-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modais Gerenciadas com Optimistic Updates */}
      {editingModule && (
        <EditModuleDialog
          module={editingModule}
          open={!!editingModule}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingModule(null);
          }}
          onSuccess={(upMod) => {
            setModuleList((prev) =>
              prev.map((m) => (String(m.id) === String(upMod.id) ? { ...m, ...upMod } : m))
            );
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
          onSuccess={(newLes) => {
            setModuleList((prev) =>
              prev.map((m) =>
                String(m.id) === String(newLes.module_id)
                  ? { ...m, lessons: [...(m.lessons || []), newLes] }
                  : m
              )
            );
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
          onSuccess={(upLes) => {
            setModuleList((prev) =>
              prev.map((m) => ({
                ...m,
                lessons: (m.lessons || []).map((l: any) =>
                  String(l.id) === String(upLes.id) ? { ...l, ...upLes } : l
                ),
              }))
            );
          }}
        />
      )}
    </div>
  );
}
