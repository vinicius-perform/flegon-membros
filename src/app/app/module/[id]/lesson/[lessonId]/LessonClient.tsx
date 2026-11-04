'use client';

import { Play, CheckCircle2, ChevronLeft, Menu, Lock, ChevronRight, FileText, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import CustomVideoPlayer from '@/components/player/custom-video-player';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { getModuleWithLessonsAction } from '@/app/admin/modules/actions';

interface LessonClientProps {
  params?: any;
  modId?: string;
  lessId?: string;
  initialModule?: any;
  initialLessons?: any[];
  initialRole?: string;
}

export default function LessonClient({
  params,
  modId: propModId,
  lessId: propLessId,
  initialModule,
  initialLessons,
  initialRole = 'student',
}: LessonClientProps) {
  // Support both server-passed props and unwrapped params
  const unwrappedParams = params ? (use(params) as any) : null;
  const modId = propModId || unwrappedParams?.id || 'mod-1';
  const lessId = propLessId || unwrappedParams?.lessonId || 'first';

  // Compute initial active lesson from initialLessons if provided
  let initialActiveLesson: any = null;
  if (initialLessons && initialLessons.length > 0) {
    if (lessId === 'first') {
      initialActiveLesson = initialLessons[0];
    } else {
      initialActiveLesson =
        initialLessons.find((l: any) => String(l.id) === String(lessId)) || initialLessons[0];
    }
  }

  const [currentModule, setCurrentModule] = useState<any>(initialModule || null);
  const [moduleLessons, setModuleLessons] = useState<any[]>(initialLessons || []);
  const [lesson, setLesson] = useState<any>(initialActiveLesson);
  const [initialTime, setInitialTime] = useState<number | null>(0);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [blockReason, setBlockReason] = useState<'premium' | 'scheduled' | null>(null);
  const [loading, setLoading] = useState(!initialLessons);
  const [isEmptyModule, setIsEmptyModule] = useState(
    Boolean(initialLessons && initialLessons.length === 0)
  );
  const [userRole, setUserRole] = useState<string>(initialRole);
  const [userPlan, setUserPlan] = useState<string>('basic');
  const [isCompleted, setIsCompleted] = useState(false);

  // Helper to determine blocking
  const evaluateBlocking = (targetLesson: any, role: string, plan: string) => {
    if (!targetLesson) return { shouldBlock: false, reason: null };
    if (role === 'admin') return { shouldBlock: false, reason: null };

    const isPremium = targetLesson.is_premium;
    const premiumDateStr = targetLesson.premium_start_date;
    const premiumDate = premiumDateStr ? new Date(premiumDateStr) : null;
    const releaseDateStr = targetLesson.release_date;
    const releaseDate = releaseDateStr ? new Date(releaseDateStr) : null;
    const now = new Date();

    if (releaseDate && now < releaseDate) {
      return { shouldBlock: true, reason: 'scheduled' as const };
    }

    if (isPremium && premiumDate && now >= premiumDate) {
      if (plan !== 'premium') {
        return { shouldBlock: true, reason: 'premium' as const };
      }
    }

    return { shouldBlock: false, reason: null };
  };

  useEffect(() => {
    let isMounted = true;

    async function syncData() {
      // 1. Fetch user auth if possible
      let localRole = userRole;
      let localPlan = userPlan;

      try {
        const { data: authResult } = await supabase.auth.getUser();
        const user = authResult?.user;
        if (user) {
          const { data: userRow } = await supabase
            .from('users')
            .select('role, plan_type')
            .eq('id', user.id)
            .single();

          if (userRow) {
            localRole = userRow.role || localRole;
            localPlan = userRow.plan_type?.toLowerCase() || localPlan;
            if (isMounted) {
              setUserRole(localRole);
              setUserPlan(localPlan);
            }
          }
        }
      } catch {
        // Fallback to cookie role
      }

      // 2. Fetch module and lessons if not already present or if we need fresh data
      let lessons = moduleLessons;
      let mod = currentModule;

      if (!lessons || lessons.length === 0) {
        try {
          const res = await getModuleWithLessonsAction(modId);
          if (res && isMounted) {
            mod = res.module;
            lessons = res.lessons || [];
            setCurrentModule(mod);
            setModuleLessons(lessons);
          }
        } catch (e) {
          console.warn('Erro ao carregar dados do módulo:', e);
        }
      }

      if (!isMounted) return;

      if (!lessons || lessons.length === 0) {
        setIsEmptyModule(true);
        setLoading(false);
        return;
      }

      setIsEmptyModule(false);

      // 3. Resolve active lesson
      let targetLesson = null;
      if (lessId === 'first') {
        targetLesson = lessons[0];
      } else {
        targetLesson = lessons.find((l: any) => String(l.id) === String(lessId)) || lessons[0];
      }

      if (targetLesson) {
        setLesson(targetLesson);

        const { shouldBlock, reason } = evaluateBlocking(targetLesson, localRole, localPlan);
        setIsBlocked(shouldBlock);
        setBlockReason(reason);

        // Load progress from localStorage or Supabase
        try {
          const savedProgress = localStorage.getItem(`flegon_progress_${targetLesson.id}`);
          if (savedProgress) {
            setInitialTime(Number(savedProgress) || 0);
          }
        } catch {}
      }

      setLoading(false);
    }

    syncData();

    return () => {
      isMounted = false;
    };
  }, [modId, lessId]);

  const handleProgress = async (seconds: number) => {
    if (!lesson?.id) return;
    try {
      localStorage.setItem(`flegon_progress_${lesson.id}`, String(Math.floor(seconds)));
    } catch {}

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      await supabase.from('user_progress').upsert(
        {
          user_id: authData.user.id,
          lesson_id: lesson.id,
          progress_seconds: Math.floor(seconds),
          completed: isCompleted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      );
    } catch {
      // Ignora erro de mock
    }
  };

  const handleToggleComplete = async () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);

    if (!lesson?.id) return;
    try {
      localStorage.setItem(`flegon_completed_${lesson.id}`, String(nextState));
    } catch {}

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await supabase.from('user_progress').upsert(
          {
            user_id: authData.user.id,
            lesson_id: lesson.id,
            completed: nextState,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        );
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1115] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#BFA783]/30 border-t-[#BFA783] rounded-full animate-spin" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#A6ACAF]">
            Carregando conteúdo...
          </span>
        </div>
      </div>
    );
  }

  if (isEmptyModule) {
    return (
      <div className="min-h-screen bg-[#0A1115] flex flex-col items-center justify-center p-6 text-center text-[#F5F3EF]">
        <div className="max-w-md space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#172127] border border-[#695C49]/30 flex items-center justify-center mx-auto text-[#BFA783]">
            <Play className="h-6 w-6 ml-0.5" />
          </div>
          <h2 className="text-2xl font-serif font-medium text-[#F5F3EF]">Módulo em Estruturação</h2>
          <p className="text-xs text-[#A6ACAF] leading-relaxed">
            As aulas deste módulo estão sendo selecionadas pela equipe do Dr. Flegon David e estarão disponíveis em breve.
          </p>
          <Link href="/app/home">
            <Button variant="outline" className="text-xs tracking-wider uppercase border-[#695C49]/40 hover:bg-[#1D292F] text-[#E9DDC9]">
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#0A1115] flex flex-col items-center justify-center p-6 text-center text-[#F5F3EF]">
        <p className="text-sm text-[#A6ACAF] mb-4">Aula não encontrada ou indisponível.</p>
        <Link href="/app/home">
          <Button variant="outline" className="text-xs tracking-wider uppercase border-[#695C49]/40 hover:bg-[#1D292F] text-[#E9DDC9]">
            Voltar ao Início
          </Button>
        </Link>
      </div>
    );
  }

  const videoId = lesson.video_url || 'dQw4w9WgXcQ';
  const moduleTitle = currentModule?.title || `Módulo • ${modId}`;

  return (
    <div className="bg-[#0A1115] min-h-screen text-[#F5F3EF] flex flex-col lg:flex-row pt-20">
      {/* Coluna Principal: Player e Detalhes */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#695C49]/20">
        <div className="w-full bg-[#05090C] flex items-center justify-center relative p-4 md:p-8">
          {isBlocked ? (
            <div className="w-full aspect-video max-w-5xl rounded-2xl bg-[#172127] border border-[#695C49]/40 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#BFA783]/5 to-transparent pointer-events-none" />
              <div className="h-20 w-20 bg-[#1D292F] border border-[#695C49]/50 rounded-full flex items-center justify-center mb-6 ring-8 ring-[#BFA783]/5">
                <Lock className="w-8 h-8 text-[#BFA783]" />
              </div>

              {blockReason === 'scheduled' ? (
                <>
                  <h2 className="text-2xl md:text-3xl font-serif font-medium text-[#F5F3EF] mb-3">
                    Conteúdo Programado
                  </h2>
                  <p className="text-[#A6ACAF] max-w-md mx-auto mb-8 leading-relaxed text-xs">
                    Esta aula estará liberada para você em{' '}
                    <strong className="text-[#E9DDC9] font-semibold">
                      {lesson.release_date ? new Date(lesson.release_date).toLocaleDateString('pt-BR') : 'breve'}
                    </strong>.
                  </p>
                  <Link href="/app/home">
                    <Button variant="outline" className="px-8 h-11 text-xs font-semibold uppercase tracking-[0.2em] border-[#695C49]/40 hover:bg-[#1D292F] text-[#E9DDC9]">
                      Voltar para a Trilha
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-2xl md:text-3xl font-serif font-medium text-[#F5F3EF] mb-3">
                    Conteúdo Exclusivo
                  </h2>
                  <p className="text-[#A6ACAF] max-w-md mx-auto mb-8 leading-relaxed text-xs">
                    Este conteúdo faz parte da mentoria avançada do Dr. Flegon David com plano <strong className="text-[#BFA783]">Premium</strong> ativo.
                  </p>
                  <Button variant="premium" className="px-8 h-11 text-xs font-semibold uppercase tracking-[0.2em]">
                    Solicitar Upgrade
                  </Button>
                </>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`w-full max-w-5xl relative ${
                lesson.is_premium
                  ? 'ring-1 ring-[#BFA783]/40 shadow-[0_0_50px_rgba(191,167,131,0.15)]'
                  : 'shadow-2xl'
              } rounded-xl overflow-hidden bg-black`}
            >
              {initialTime !== null && (
                <CustomVideoPlayer
                  videoId={videoId}
                  initialTime={initialTime}
                  onProgress={handleProgress}
                />
              )}
              {lesson.is_premium && (
                <div className="absolute top-4 right-4 z-30 pointer-events-none">
                  <Badge variant="premium" className="px-3 py-1 text-[9px] tracking-[0.2em] shadow-lg">
                    ACESSO PREMIUM
                  </Badge>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="w-full max-w-5xl p-6 md:p-10 mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-[#695C49]/25">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Link
                  href="/app/home"
                  className="hidden lg:flex items-center gap-1.5 text-[#BFA783] hover:text-[#E9DDC9] font-semibold text-[10px] tracking-[0.2em] uppercase transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" /> Dashboard
                </Link>
                <div className="hidden lg:block h-3 w-[1px] bg-[#695C49]/40" />
                <span className="text-[10px] text-[#A6ACAF] uppercase tracking-[0.2em] font-medium truncate max-w-[280px]">
                  {moduleTitle}
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-serif font-medium text-[#F5F3EF] leading-snug tracking-normal flex flex-wrap items-center gap-3">
                {lesson.title}
                {lesson.is_premium && (
                  <span className="h-2 w-2 rounded-full bg-[#BFA783] animate-pulse" />
                )}
              </h1>
              <div className="flex items-center gap-6 text-[#A6ACAF]">
                <div className="flex items-center gap-2">
                  <Play className="h-3.5 w-3.5 text-[#BFA783]" />
                  <span className="text-xs uppercase tracking-wider font-medium">Aula Exclusiva</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#BFA783]" />
                  <span className="text-xs uppercase tracking-wider font-medium">Dr. Flegon David</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleToggleComplete}
                variant={isCompleted ? 'outline' : isBlocked ? 'ghost' : 'premium'}
                disabled={isBlocked}
                className={`h-11 px-8 text-xs font-semibold uppercase tracking-[0.18em] gap-2.5 transition-all ${
                  isCompleted
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : ''
                }`}
              >
                {isCompleted ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    AULA CONCLUÍDA
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    CONCLUIR AULA
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#172127]/80 border border-[#695C49]/25 p-6 rounded-xl">
                <h3 className="text-base font-serif font-medium text-[#F5F3EF] mb-3">Sobre esta aula</h3>
                <p className="text-xs text-[#A6ACAF] leading-relaxed">
                  {currentModule?.description ||
                    'Esta aula aborda os princípios anatômicos e refinamentos técnicos cirúrgicos da mentoria Body Sculpt. Conteúdo clínico exclusivo desenvolvido pelo Dr. Flegon David para elevar os resultados práticos da sua atuação médica.'}
                </p>
              </div>

              {/* Materiais Complementares */}
              {lesson.attachments && lesson.attachments.length > 0 && (
                <div className="bg-[#172127]/80 border border-[#695C49]/25 p-6 rounded-xl space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#BFA783]">
                    Materiais de Apoio & PDFs
                  </h3>
                  <div className="space-y-2 pt-1">
                    {lesson.attachments.map((file: any, idx: number) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-[#0A1115]/50 border border-[#695C49]/30 hover:border-[#BFA783]/50 hover:bg-[#1D292F] transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-[#BFA783]" />
                          <span className="text-xs text-[#F5F3EF] font-medium group-hover:text-[#BFA783] transition-colors">
                            {file.name}
                          </span>
                        </div>
                        <Download className="h-4 w-4 text-[#A6ACAF] group-hover:text-[#BFA783] transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Card className="bg-[#172127]/90 border border-[#695C49]/35 p-5">
                <h4 className="text-[10px] font-semibold text-[#BFA783] uppercase tracking-[0.22em] mb-3">
                  Suporte & Mentoria
                </h4>
                <p className="text-[11px] text-[#A6ACAF] mb-5 leading-relaxed">
                  Dúvidas técnicas ou casos clínicos? Envie sua solicitação para a equipe da mentoria Body Sculpt.
                </p>
                <Button
                  variant="outline"
                  className="w-full text-[10px] tracking-widest font-semibold h-10 uppercase border-[#695C49]/40 hover:bg-[#1D292F] text-[#E9DDC9]"
                >
                  Suporte Clínico
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Lateral: Grade Curricular */}
      <div className="w-full lg:w-[400px] border-l border-[#695C49]/25 bg-[#0D151A] flex flex-col h-auto lg:h-[calc(100vh-80px)] lg:sticky top-20">
        <div className="p-6 border-b border-[#695C49]/25 flex items-center justify-between bg-[#172127]/70 backdrop-blur-xl sticky top-0 lg:static z-20">
          <div>
            <h3 className="text-[9px] font-semibold text-[#BFA783] uppercase tracking-[0.3em]">Trilha do Módulo</h3>
            <p className="text-base font-serif font-medium text-[#F5F3EF] mt-0.5">Grade de Aulas</p>
          </div>
          <div className="h-8 w-8 rounded-lg border border-[#695C49]/30 flex items-center justify-center bg-[#1D292F]">
            <Menu className="h-4 w-4 text-[#A6ACAF]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {moduleLessons.length > 0 ? (
            moduleLessons.map((l: any, idx: number) => {
              const isActive = String(l.id) === String(lesson.id);
              const isPremium = l.is_premium;
              const premiumDateStr = l.premium_start_date;
              const premiumDateList = premiumDateStr ? new Date(premiumDateStr) : null;
              const releaseDateList = l.release_date ? new Date(l.release_date) : null;

              let isBlockedInList = false;
              let isScheduledInList = false;

              if (releaseDateList && new Date() < releaseDateList && userRole !== 'admin') {
                isBlockedInList = true;
                isScheduledInList = true;
              }

              if (!isBlockedInList && isPremium && premiumDateList) {
                if (new Date() >= premiumDateList) {
                  if (userRole !== 'admin' && userPlan !== 'premium') {
                    isBlockedInList = true;
                  }
                }
              }

              return (
                <Link href={`/app/module/${modId}/lesson/${l.id}`} key={l.id} className="block group">
                  <div
                    className={`p-3.5 rounded-lg transition-all duration-200 flex items-center gap-3.5 ${
                      isActive
                        ? 'bg-[#BFA783] text-[#0A1115] shadow-[0_2px_12px_rgba(191,167,131,0.25)]'
                        : 'bg-[#172127]/60 border border-[#695C49]/20 hover:bg-[#1D292F] hover:border-[#695C49]/40'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 shrink-0 rounded-md flex items-center justify-center ${
                        isActive ? 'bg-[#0A1115]/15' : 'bg-[#0A1115]/50 border border-[#695C49]/30'
                      }`}
                    >
                      {isActive ? (
                        <Play className="h-3.5 w-3.5 text-[#0A1115] fill-current ml-0.5" />
                      ) : isScheduledInList ? (
                        <Lock className="h-3 w-3 text-[#A6ACAF]" />
                      ) : (
                        <span className="text-[10px] font-semibold text-[#A6ACAF]">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium tracking-tight truncate ${
                          isActive
                            ? 'text-[#0A1115] font-semibold'
                            : 'text-[#F5F3EF] group-hover:text-[#BFA783] transition-colors'
                        }`}
                      >
                        {l.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isBlockedInList && !isScheduledInList && (
                          <Lock className="h-2.5 w-2.5 text-[#8B2E2E]" />
                        )}
                        {isScheduledInList && (
                          <span className="text-[8px] text-[#BFA783] font-semibold uppercase tracking-wider">
                            Estreia {releaseDateList?.toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {l.is_premium && (
                          <Badge className="h-3.5 px-1.5 text-[7px] bg-[#BFA783]/20 text-[#BFA783] border-none font-bold">
                            PREMIUM
                          </Badge>
                        )}
                        {!isScheduledInList && (
                          <span
                            className={`text-[8px] uppercase tracking-wider ${
                              isActive ? 'text-[#0A1115]/70' : 'text-[#A6ACAF]'
                            }`}
                          >
                            {isActive ? 'Reproduzindo' : 'Vídeo aula'}
                          </span>
                        )}
                      </div>
                    </div>
                    {!isActive && !isBlockedInList && (
                      <ChevronRight className="h-3.5 w-3.5 text-[#A6ACAF]/50 group-hover:text-[#BFA783] transition-all group-hover:translate-x-0.5" />
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-[#A6ACAF] text-xs text-center italic py-8 border border-dashed border-[#695C49]/20 rounded-xl">
              Aguardando novos conteúdos...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
