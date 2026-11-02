'use client';

import { Play, CheckCircle2, ChevronLeft, Menu, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import CustomVideoPlayer from '@/components/player/custom-video-player';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';

export default function LessonClient({ params }: { params: any }) {
  const unwrappedParams = use(params) as any;
  const modId = unwrappedParams.id;
  const lessId = unwrappedParams.lessonId;

  const [lesson, setLesson] = useState<any>(null);
  const [moduleLessons, setModuleLessons] = useState<any[]>([]);
  const [initialTime, setInitialTime] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [blockReason, setBlockReason] = useState<'premium' | 'scheduled' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmptyModule, setIsEmptyModule] = useState(false);
  const [userRole, setUserRole] = useState<string>('student');
  const [userPlan, setUserPlan] = useState<string>('basic');

  useEffect(() => {
    async function init() {
      const [authResult, lessonsResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('lessons').select('*').eq('module_id', modId)
      ]);

      const user = authResult.data?.user;
      let localRole = 'student';
      let localPlan = 'basic';
      
      if (user) {
         const { data: userRow } = await supabase.from('users').select('role, plan_type').eq('id', user.id).single();
         if (userRow) {
           localRole = userRow.role;
           localPlan = userRow.plan_type?.toLowerCase() || 'basic';
           setUserRole(localRole);
           setUserPlan(localPlan);
         }
      }

      const allLessons = lessonsResult.data;
      const err = lessonsResult.error;
      
      let sortedLessons: any[] = [];
      if (allLessons) {
         sortedLessons = [...allLessons].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
         setModuleLessons(sortedLessons);
      }
      
      if (err) console.error("Erro puxando aulas:", err);

      if (sortedLessons.length === 0) {
         setIsEmptyModule(true);
         setLoading(false);
         return;
      }

      let currentLessonData = null;
      if (lessId === 'first') {
         currentLessonData = sortedLessons[0];
      } else {
         currentLessonData = sortedLessons.find((l: any) => String(l.id) === String(lessId));
         if (!currentLessonData) {
            const { data: dbLesson } = await supabase.from('lessons').select('*').eq('id', lessId).single();
            if (dbLesson) currentLessonData = dbLesson;
         }
      }
      
      if (currentLessonData) {
        setLesson(currentLessonData);
        
        const isPremium = currentLessonData.is_premium;
        const premiumDateStr = currentLessonData.premium_start_date;
        const premiumDate = premiumDateStr ? new Date(premiumDateStr) : null;
        
        const releaseDateStr = currentLessonData.release_date;
        const releaseDate = releaseDateStr ? new Date(releaseDateStr) : null;
        
        const now = new Date();
        let shouldBlock = false;
        let reason: 'premium' | 'scheduled' | null = null;

        // 1. Prioridade: Bloqueio por Data de Estreia (Scheduled)
        if (releaseDate && now < releaseDate && localRole !== 'admin') {
           shouldBlock = true;
           reason = 'scheduled';
        }
        
        // 2. Bloqueio Premium (apenas se não estiver bloqueado por data)
        if (!shouldBlock && isPremium && premiumDate) {
           if (now >= premiumDate) {
              if (localRole !== 'admin' && localPlan !== 'premium') {
                 shouldBlock = true;
                 reason = 'premium';
              }
           }
        }

        setIsBlocked(shouldBlock);
        setBlockReason(reason);

        // Fetch initial progress time
        if (user && currentLessonData.id) {
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('progress_seconds')
            .eq('user_id', user.id)
            .eq('lesson_id', currentLessonData.id)
            .single();
          
          setInitialTime(progressData?.progress_seconds || 0);
        } else {
          setInitialTime(0);
        }
      }
      
      setLoading(false);
    }

    init();
  }, [modId, lessId]);

  const handleProgress = async (seconds: number) => {
    if (!lesson?.id) return;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      await supabase.from('user_progress').upsert({
        user_id: authData.user.id,
        lesson_id: lesson.id,
        progress_seconds: Math.floor(seconds),
        completed: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
    } catch (e) {
      console.error("Erro salvando progresso:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1115] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#BFA783]/30 border-t-[#BFA783] rounded-full animate-spin" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#A6ACAF]">Carregando conteúdo...</span>
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
            <Button variant="outline" className="text-xs tracking-wider uppercase">
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
          <Button variant="outline" className="text-xs tracking-wider uppercase">Voltar ao Início</Button>
        </Link>
      </div>
    );
  }

  const videoId = lesson.video_url || 'dQw4w9WgXcQ';

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
                    <h2 className="text-2xl md:text-3xl font-serif font-medium text-[#F5F3EF] mb-3">Conteúdo Programado</h2>
                    <p className="text-[#A6ACAF] max-w-md mx-auto mb-8 leading-relaxed text-xs">
                      Esta aula estará liberada para você em{' '}
                      <strong className="text-[#E9DDC9] font-semibold">
                        {new Date(lesson.release_date).toLocaleDateString('pt-BR')}
                      </strong>.
                    </p>
                    <Link href="/app/home">
                      <Button variant="outline" className="px-8 h-11 text-xs font-semibold uppercase tracking-[0.2em]">
                        Voltar para a Trilha
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl md:text-3xl font-serif font-medium text-[#F5F3EF] mb-3">Conteúdo Exclusivo</h2>
                    <p className="text-[#A6ACAF] max-w-md mx-auto mb-8 leading-relaxed text-xs">
                      Este conteúdo faz parte da mentoria avançada do Dr. Flegon David com plano **Premium** ativo.
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
               className={`w-full max-w-5xl relative ${lesson.is_premium ? 'ring-1 ring-[#BFA783]/40 shadow-[0_0_50px_rgba(191,167,131,0.15)]' : 'shadow-2xl'} rounded-xl overflow-hidden bg-black`}
            >
              {initialTime !== null && (
                 <CustomVideoPlayer 
                   videoId={videoId} 
                   initialTime={initialTime} 
                   onProgress={handleProgress} 
                 />
              )}
              {lesson.is_premium && (
                <div className="absolute top-4 right-4 z-30">
                  <Badge variant="premium" className="px-3 py-1 text-[9px] tracking-[0.2em]">ACESSO PREMIUM</Badge>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="w-full max-w-5xl p-6 md:p-10 mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-[#695C49]/25">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <Link href="/app/home" className="hidden lg:flex items-center gap-1.5 text-[#BFA783] hover:text-[#E9DDC9] font-semibold text-[10px] tracking-[0.2em] uppercase transition-colors">
                  <ChevronLeft className="h-3 w-3" /> Dashboard
                 </Link>
                 <div className="hidden lg:block h-3 w-[1px] bg-[#695C49]/40" />
                 <span className="text-[10px] text-[#A6ACAF] uppercase tracking-[0.2em] font-medium">Módulo • {modId}</span>
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
                variant={isBlocked ? "ghost" : "premium"} 
                disabled={isBlocked} 
                className="h-11 px-8 text-xs font-semibold uppercase tracking-[0.18em] gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                CONCLUIR AULA
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#172127]/80 border border-[#695C49]/25 p-6 rounded-xl">
                   <h3 className="text-base font-serif font-medium text-[#F5F3EF] mb-3">Sobre esta aula</h3>
                   <p className="text-xs text-[#A6ACAF] leading-relaxed">
                     Esta aula aborda os princípios anatômicos e refinamentos técnicos cirúrgicos da mentoria Body Sculpt. Conteúdo clínico exclusivo desenvolvido pelo Dr. Flegon David para elevar os resultados práticos da sua atuação médica.
                   </p>
                </div>
             </div>
             <div>
                <Card className="bg-[#172127]/90 border border-[#695C49]/35 p-5">
                   <h4 className="text-[10px] font-semibold text-[#BFA783] uppercase tracking-[0.22em] mb-3">Suporte & Mentoria</h4>
                   <p className="text-[11px] text-[#A6ACAF] mb-5 leading-relaxed">
                     Dúvidas técnicas ou casos clínicos? Envie sua solicitação para a equipe da mentoria Body Sculpt.
                   </p>
                   <Button variant="outline" className="w-full text-[10px] tracking-widest font-semibold h-10 uppercase">
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
           {moduleLessons.length > 0 ? moduleLessons.map((l: any, idx: number) => {
             const isActive = l.id === lesson.id;
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
                         <span className="text-[10px] font-semibold text-[#A6ACAF]">{String(idx + 1).padStart(2, '0')}</span>
                       )}
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className={`text-xs font-medium tracking-tight truncate ${isActive ? 'text-[#0A1115] font-semibold' : 'text-[#F5F3EF] group-hover:text-[#BFA783] transition-colors'}`}>
                         {l.title}
                       </p>
                       <div className="flex items-center gap-2 mt-0.5">
                          {isBlockedInList && !isScheduledInList && <Lock className="h-2.5 w-2.5 text-[#8B2E2E]" />}
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
                            <span className={`text-[8px] uppercase tracking-wider ${isActive ? 'text-[#0A1115]/70' : 'text-[#A6ACAF]'}`}>
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
           }) : (
             <div className="text-[#A6ACAF] text-xs text-center italic py-8 border border-dashed border-[#695C49]/20 rounded-xl">
               Aguardando novos conteúdos...
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
