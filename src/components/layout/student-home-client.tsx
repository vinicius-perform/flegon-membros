'use client';

import { Play, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

function ModuleRow({ title, modules }: { title: string; modules: any[] }) {
  if (!modules?.length) return null;
  return (
    <div className="space-y-5 pt-8">
      <div className="flex items-center justify-between px-6 md:px-12 max-w-[1920px] mx-auto">
        <h3 className="text-xl md:text-2xl font-serif font-normal tracking-wide text-[#F5F3EF]">
          {title}
        </h3>
        <Link
          href="#"
          className="text-xs text-[#BFA783] hover:text-[#E9DDC9] transition-colors flex items-center gap-1 font-semibold tracking-[0.2em] uppercase text-[10px]"
        >
          Ver Todos <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-6 px-6 md:px-12 max-w-[1920px] mx-auto overflow-x-auto pb-6 snap-x style-scrollbar-hide">
        {modules.map((module, i) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="snap-start shrink-0"
          >
            <Link href={`/app/module/${module.id}/lesson/first`} className="focus:outline-none block group">
              <Card className="w-[320px] md:w-[350px] h-[210px] overflow-hidden relative border-[#695C49]/30 bg-[#172127]/90 hover:border-[#BFA783]/60 transition-all duration-500 shadow-[0_8px_25px_rgba(0,0,0,0.35)] rounded-xl">
                <img
                  src={
                    module.banner_image_horizontal ||
                    module.cover_image_vertical ||
                    'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={module.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 pointer-events-none"
                />
                
                {/* Dark Editorial Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1115] via-[#0A1115]/50 to-transparent opacity-95" />

                <CardContent className="absolute inset-0 p-5 flex flex-col justify-end z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className="text-[8px] uppercase tracking-[0.25em] border-[#695C49]/60 bg-[#1D292F]/80 text-[#E9DDC9] px-2 py-0.5"
                    >
                      Módulo Exclusivo
                    </Badge>
                  </div>
                  <h4 className="font-serif font-medium text-lg text-[#F5F3EF] line-clamp-2 leading-snug group-hover:text-[#BFA783] transition-colors">
                    {module.title}
                  </h4>
                </CardContent>

                {/* Subtle Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px] z-20">
                  <div className="h-12 w-12 rounded-full bg-[#BFA783] text-[#0A1115] flex items-center justify-center transform scale-90 group-hover:scale-100 transition-all shadow-[0_2px_15px_rgba(191,167,131,0.4)]">
                    <Play className="h-5 w-5 ml-0.5 fill-current" />
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function StudentHomeClient({
  config,
  modulesToUse,
}: {
  config: any;
  modulesToUse: any[];
}) {
  const banner = {
    title: config?.banner_title || 'Body Sculpt Mentoria',
    subtitle:
      config?.banner_subtitle ||
      'Aperfeiçoamento médico e refinamento técnico cirúrgico de alto nível com o Dr. Flegon David.',
    buttonText: config?.banner_button_text || 'INICIAR JORNADA',
    imageUrl:
      config?.banner_image_url ||
      'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80',
  };

  const sections = config?.sections || [
    { id: 'highlight_modules', label: 'Módulos em Destaque', active: true },
    { id: 'recent_lessons', label: 'Trilha de Aprendizado', active: true },
  ];

  return (
    <div className="bg-[#0A1115] min-h-screen relative overflow-hidden text-[#F5F3EF]">
      {/* Luxury Subtle Atmosphere Light */}
      <div className="fixed inset-0 pointer-events-none opacity-25">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#BFA783]/10 blur-[170px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#1D292F]/60 blur-[150px] rounded-full" />
      </div>

      {/* Cinematic Hero Section */}
      <div className="relative w-full h-[85vh] min-h-[580px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.45 }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
            src={banner.imageUrl}
            alt="Dr. Flegon David"
            decoding="async"
            className="w-full h-full object-cover pointer-events-none"
          />
          {/* Gradients to blend smoothly with Flegon dark palette */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1115] via-[#0A1115]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1115] via-[#0A1115]/40 to-transparent" />
        </div>

        <div className="relative z-10 px-6 md:px-12 w-full max-w-6xl flex flex-col items-center text-center pt-16">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15 }}
            className="space-y-8"
          >
            <div className="flex flex-col items-center gap-3">
              <Badge
                variant="outline"
                className="px-4 py-1 text-[9px] tracking-[0.35em] font-semibold uppercase border-[#695C49]/60 bg-[#172127]/80 text-[#E9DDC9]"
              >
                Membros Exclusivos • Dr. Flegon David
              </Badge>
              <div className="h-8 w-[1px] bg-gradient-to-b from-[#BFA783]/60 to-transparent" />
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light text-[#F5F3EF] leading-[1.05] tracking-tight">
              {banner.title.split(' ').map((word: string, i: number) => (
                <span
                  key={i}
                  className={
                    i % 2 === 0
                      ? 'inline-block mr-3'
                      : 'inline-block mr-3 font-normal text-transparent bg-clip-text bg-gradient-to-b from-[#BFA783] to-[#E9DDC9]'
                  }
                >
                  {word}
                </span>
              ))}
            </h1>

            <p className="text-sm md:text-base text-[#A6ACAF] font-sans font-normal leading-relaxed max-w-xl mx-auto">
              {banner.subtitle}
            </p>
          </motion.div>
        </div>

        {/* Ambient bottom line */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50">
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#BFA783]/70 to-transparent" />
        </div>
      </div>

      {/* Content Sections */}
      <div className="relative z-20 pb-32 space-y-8 -mt-16">
        {sections.map((section: any) => {
          if (!section.active) return null;
          const sModules = modulesToUse || [];
          return <ModuleRow key={section.id} title={section.label} modules={sModules} />;
        })}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .style-scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .style-scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  );
}
