'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, GripVertical, Save, Image as ImageIcon, ToggleLeft, ToggleRight, Play, Info, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { supabase } from '@/lib/supabase';

const initialSections = [
  { id: 'continue_watching', label: 'Continue assistindo', active: true },
  { id: 'highlight_modules', label: 'Módulos em Destaque', active: true },
  { id: 'recent_lessons', label: 'Aulas Recentes', active: true },
  { id: 'premium_content', label: 'Conteúdos Premium', active: true },
];

function SortableSectionItem({ id, section, toggleSection }: { id: string, section: any, toggleSection: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl mb-3 group hover:border-white/20 transition-colors relative z-10">
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="text-zinc-500 hover:text-white cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="text-white font-medium">{section.label}</span>
      </div>
      <button 
        type="button" 
        onClick={() => toggleSection(section.id)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${section.active ? 'bg-primary/20 text-primary' : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800'}`}
      >
        {section.active ? (
          <><ToggleRight className="h-4 w-4" /> Ativo</>
        ) : (
          <><ToggleLeft className="h-4 w-4" /> Oculto</>
        )}
      </button>
    </div>
  );
}

export default function AdminExperiencePage() {
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bannerTitle, setBannerTitle] = useState('Especialização em Suturas');
  const [bannerSubtitle, setBannerSubtitle] = useState('Acesso premium às técnicas mais avançadas da cirurgia moderna.');
  const [bannerButton, setBannerButton] = useState('Assistir Agora');
  const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80');

  const [mockModules, setMockModules] = useState<any[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      // Carregar configs da home
      const { data: config } = await supabase.from('home_config').select('*').eq('id', 1).single();
      if (config) {
        setBannerTitle(config.banner_title || '');
        setBannerSubtitle(config.banner_subtitle || '');
        setBannerButton(config.banner_button_text || '');
        setBannerImage(config.banner_image_url || '');
        if (config.sections) {
          setSections(config.sections);
        }
      }

      // Carregar preview real de módulos para o mock da tela
      const { data: mods } = await supabase.from('modules').select('*').eq('status', 'active').limit(4);
      if (mods) {
        setMockModules(mods.map(m => ({
          id: m.id,
          title: m.title,
          progress: Math.floor(Math.random() * 100), // Visual fake progress
          image: m.cover_image_vertical || m.banner_image_horizontal || 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'
        })));
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadBanner(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadBanner(file);
    }
  };

  const uploadBanner = async (file: File) => {
    setSaving(true);
    const fileName = `home-banner-${Date.now()}`;
    const { error: uploadError } = await supabase.storage.from('courses').upload(fileName, file, { upsert: false });
    
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('courses').getPublicUrl(fileName);
      setBannerImage(publicUrl);
    }
    setSaving(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleSection = (id: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await supabase.from('home_config').upsert({
      id: 1,
      banner_title: bannerTitle,
      banner_subtitle: bannerSubtitle,
      banner_button_text: bannerButton,
      banner_image_url: bannerImage,
      sections: sections,
    });

    setSaving(false);
    if (!error) {
      alert('Configurações da Área do Aluno salvas com sucesso no banco de dados!');
    } else {
      alert('Erro ao salvar configurações.');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Carregando configurações atuais...
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Branding & Interface</span>
          </div>
          <h2 className="text-4xl font-heading font-bold tracking-tight text-white uppercase">Experiência do Aluno</h2>
          <p className="text-zinc-500 text-sm mt-1">Personalização estética e curadoria da identidade visual Home.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} variant="premium" className="h-10 text-[10px] font-bold tracking-widest uppercase px-6">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'PROCESSANDO...' : 'PUBLICAR NA HOME'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-black/40 border-white/5 backdrop-blur-2xl overflow-hidden group">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-white font-heading font-medium">Arquitetura do Hero Banner</CardTitle>
            <CardDescription className="text-zinc-500 text-xs">O impacto visual prioritário da plataforma Premium.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-[21/9] w-full bg-zinc-900/50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-500 relative overflow-hidden group/upload shadow-inner ${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-white/5 hover:border-primary/30'}`}
            >
              <img src={bannerImage} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover/upload:opacity-10 transition-opacity duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <div className="h-14 w-14 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover/upload:border-primary/30 transition-all z-20">
                 <ImageIcon className={`h-6 w-6 transition-transform duration-500 group-hover/upload:scale-110 ${isDragging ? 'text-primary scale-125' : 'text-zinc-500'}`} />
              </div>
              <div className="text-center relative z-20 px-6">
                <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1 shadow-sm">
                  {isDragging ? 'SOLTE PARA IMPORTAR' : 'UPLOAD DE IMAGEM ESTRATÉGICA'}
                </p>
                <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest">Recomendado: 1920x800px</p>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Título de Impacto</Label>
                    <Input value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="bg-white/[0.03] border-white/10 text-sm h-12 uppercase tracking-wide font-medium" />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Texto do CTA</Label>
                    <Input value={bannerButton} onChange={e => setBannerButton(e.target.value)} className="bg-white/[0.03] border-white/10 text-sm h-12 uppercase tracking-wide font-medium" />
                 </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Narrativa do Banner (Subtítulo)</Label>
                <Input value={bannerSubtitle} onChange={e => setBannerSubtitle(e.target.value)} className="bg-white/[0.03] border-white/10 text-sm h-12 font-medium" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Endereço da Imagem (Opcional)</Label>
                <Input value={bannerImage} onChange={e => setBannerImage(e.target.value)} className="bg-white/[0.03] border-white/10 text-xs h-10 font-medium" placeholder="https://..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="bg-black/40 border-white/5 backdrop-blur-2xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-white font-heading font-medium">Organização Modular da Home</CardTitle>
              <CardDescription className="text-zinc-500 text-xs">Arraste para definir a hierarquia das seções pedagógicas.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections} strategy={verticalListSortingStrategy}>
                  {sections.map((section) => (
                    <SortableSectionItem key={section.id} id={section.id} section={section} toggleSection={toggleSection} />
                  ))}
                </SortableContext>
              </DndContext>
              <div className="mt-8 p-6 bg-primary/[0.03] border border-primary/10 rounded-2xl flex items-start gap-4">
                 <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0 mt-1">
                    <Info className="h-4 w-4 text-primary" />
                 </div>
                 <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">As seções são dinâmicas. Se um aluno não possuir progresso em "Continue Assistindo", a seção será omitida automaticamente para manter a estética limpa.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-16 space-y-8">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
              <Play className="h-5 w-5 text-primary fill-primary/20" />
           </div>
           <div>
              <h3 className="text-2xl font-heading font-bold text-white uppercase tracking-tight">Cenário de Visualização (Preview)</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Simulação em ambiente real de produção</p>
           </div>
        </div>
        
        <div className="w-full border border-white/10 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-[#0A1115] ring-1 ring-white/10 relative h-[800px] overflow-y-auto style-scrollbar-hide group/preview">
          <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-50 px-12 flex items-center pointer-events-none border-b border-white/[0.02]">
             <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 mr-4">
               <GraduationCap className="h-6 w-6 text-primary" />
             </div>
             <div className="font-heading font-bold text-white tracking-widest text-2xl">FLEGON <span className="text-primary">MEMBERS</span></div>
          </div>
          
          <div className="relative w-full h-[550px] flex items-end pb-24 group/hero">
            <img 
              src={bannerImage || 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80'}
              alt="Banner Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover/preview:scale-[1.02] transition-transform duration-[3000ms]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1115] via-[#0A1115]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1115] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-[#0A1115] to-transparent pointer-events-none" />
            
            <div className="relative z-10 px-8 md:px-16 w-full flex flex-col items-center text-center">
              <div className="space-y-10">
                <div className="flex flex-col items-center gap-4">
                  <Badge variant="premium" className="px-5 py-1 text-[10px] tracking-[0.5em] font-black uppercase ring-1 ring-primary/50 shadow-[0_0_20px_rgba(191,155,95,0.3)]">
                    ÁREA DE MEMBROS
                  </Badge>
                  <div className="h-12 w-[1px] bg-gradient-to-b from-primary/60 to-transparent" />
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-[1.1] tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  {(bannerTitle || 'CURSO DE IMPACTO').split(' ').map((word: string, i: number) => (
                    <span key={i} className={i % 2 === 0 ? "block" : "block text-transparent bg-clip-text bg-gradient-to-b from-primary to-[#F5E6CA] opacity-90"}>
                      {word}
                    </span>
                  ))}
                </h1>
                
                <p className="text-base md:text-lg text-zinc-400 drop-shadow-md font-medium leading-relaxed max-w-2xl mx-auto italic opacity-80 backdrop-blur-[1px]">
                  {bannerSubtitle || 'A narrativa principal e estratégica do seu banner preencherá este espaço com elegância e sofisticação.'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-20 pb-24 space-y-10 -mt-24">
            {sections.map(section => {
               if (!section.active) return null;
               
               let displayItems = mockModules.length > 0 ? mockModules : [];

               return (
                 <div key={section.id} className="space-y-6 pt-12">
                   <div className="flex items-center justify-between px-8 md:px-16">
                     <h3 className="text-2xl font-heading font-medium tracking-tight text-[#F5E6CA]">{section.label}</h3>
                   </div>
                   <div className="flex gap-6 px-8 md:px-16 overflow-x-auto pb-10 snap-x style-scrollbar-hide">
                     {displayItems.map((module: any, i: number) => (
                       <div key={module.id} className="snap-start shrink-0">
                         <div className="w-[340px] h-[200px] overflow-hidden group/card relative border-white/5 bg-black/60 shadow-2xl rounded-2xl">
                           <img 
                             src={module.image || 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'} 
                             alt={module.title}
                             className="absolute inset-0 w-full h-full object-cover opacity-70 transition-all duration-700"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-[#0A1115] via-transparent to-transparent opacity-90" />
                           
                           <div className="absolute inset-0 p-6 flex flex-col justify-end">
                             <div className="flex items-center gap-2 mb-2">
                               <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-primary/40 bg-primary/10 text-primary px-2 py-0">
                                 Médico
                               </Badge>
                             </div>
                             <h4 className="font-heading font-medium text-lg text-white line-clamp-2 leading-tight drop-shadow-lg">
                               {module.title}
                             </h4>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               );
            })}
            
            {sections.filter(s => s.active).length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4 bg-white/[0.01] border border-dashed border-white/5 rounded-[40px] mt-20">
                 <ToggleLeft className="h-12 w-12 text-zinc-800" />
                 <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-[10px]">Arquitetura Modular Inativa</p>
                 <p className="text-zinc-700 text-xs font-medium">Habilite seções no painel lateral para popular a interface.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .style-scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .style-scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
