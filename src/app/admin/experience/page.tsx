'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, GripVertical, Save, Image as ImageIcon, ToggleLeft, ToggleRight, Play, Info, GraduationCap, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { supabase } from '@/lib/supabase';
import { getHomeConfigAction, saveHomeConfigAction } from './actions';

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
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-4 bg-[#1D292F]/80 border border-[#695C49]/30 rounded-xl mb-3 group hover:border-[#BFA783]/50 transition-colors relative z-10">
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="text-[#A6ACAF] hover:text-[#F5F3EF] cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="text-[#F5F3EF] font-medium text-sm">{section.label}</span>
      </div>
      <button 
        type="button" 
        onClick={() => toggleSection(section.id)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${section.active ? 'bg-[#BFA783]/20 text-[#E9DDC9] border border-[#BFA783]/40' : 'bg-[#172127] text-[#A6ACAF] border border-[#695C49]/20 hover:bg-[#1D292F]'}`}
      >
        {section.active ? (
          <><ToggleRight className="h-4 w-4 text-[#BFA783]" /> Ativo</>
        ) : (
          <><ToggleLeft className="h-4 w-4 text-[#A6ACAF]" /> Oculto</>
        )}
      </button>
    </div>
  );
}

export default function AdminExperiencePage() {
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [bannerTitle, setBannerTitle] = useState('Body Sculpt Mentoria');
  const [bannerSubtitle, setBannerSubtitle] = useState('Aperfeiçoamento médico e refinamento técnico cirúrgico de alto nível com o Dr. Flegon David.');
  const [bannerButton, setBannerButton] = useState('INICIAR JORNADA');
  const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80');

  const [mockModules, setMockModules] = useState<any[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      // 1. Carregar configs da home usando ação resiliente
      const config = await getHomeConfigAction();
      if (config) {
        setBannerTitle(config.banner_title || '');
        setBannerSubtitle(config.banner_subtitle || '');
        setBannerButton(config.banner_button_text || '');
        setBannerImage(config.banner_image_url || '');
        if (config.sections && Array.isArray(config.sections) && config.sections.length > 0) {
          setSections(config.sections);
        }
      }

      // 2. Carregar preview de módulos se existirem no banco
      try {
        const { data: mods } = await supabase.from('modules').select('*').limit(4);
        if (mods && mods.length > 0) {
          setMockModules(mods.map(m => ({
            id: m.id,
            title: m.title,
            progress: Math.floor(Math.random() * 100),
            image: m.cover_image_vertical || m.banner_image_horizontal || 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80'
          })));
        }
      } catch {
        // Fallback
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
    setFeedback('Carregando imagem...');
    
    // Preview instantâneo para feedback imediato na UI
    const localUrl = URL.createObjectURL(file);
    setBannerImage(localUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setBannerImage(data.url);
        setFeedback('Imagem pronta! Clique em PUBLICAR NA HOME para salvar.');
      } else {
        setFeedback('Imagem carregada no preview.');
      }
    } catch (err: any) {
      console.warn('Upload via API falhou, mantendo preview:', err);
      setFeedback('Imagem pronta no preview.');
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
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
    setFeedback(null);
    
    try {
      const res = await saveHomeConfigAction({
        banner_title: bannerTitle,
        banner_subtitle: bannerSubtitle,
        banner_button_text: bannerButton,
        banner_image_url: bannerImage,
        sections: sections,
      });

      if (res?.success) {
        setFeedback('Configurações e imagem publicadas na Home com sucesso!');
        setTimeout(() => setFeedback(null), 4000);
      } else {
        alert('Erro ao salvar configurações.');
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações: ' + (error?.message || 'Falha de comunicação.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#A6ACAF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#BFA783]/30 border-t-[#BFA783] rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest font-semibold">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#BFA783] mb-1.5">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Branding & Interface</span>
          </div>
          <h2 className="text-3xl font-serif font-medium tracking-tight text-[#F5F3EF]">Experiência do Aluno</h2>
          <p className="text-[#A6ACAF] text-xs mt-1">Personalização estética e curadoria da identidade visual Home.</p>
        </div>

        <div className="flex items-center gap-3">
          {feedback && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#BFA783]/15 border border-[#BFA783]/30 text-[#E9DDC9] text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-[#BFA783]" />
              <span>{feedback}</span>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} variant="premium" className="h-10 text-[10px] font-bold tracking-widest uppercase px-6">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'PROCESSANDO...' : 'PUBLICAR NA HOME'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-[#172127]/90 border-[#695C49]/30 overflow-hidden">
          <CardHeader className="border-b border-[#695C49]/20 bg-[#1D292F]/40 p-6">
            <CardTitle className="text-[#F5F3EF] font-serif font-medium text-base">Arquitetura do Hero Banner</CardTitle>
            <CardDescription className="text-[#A6ACAF] text-xs">O impacto visual prioritário da plataforma Flegon Members.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-[21/9] w-full bg-[#0A1115]/80 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 relative overflow-hidden group/upload shadow-inner ${isDragging ? 'border-[#BFA783] bg-[#BFA783]/10 scale-[1.01]' : 'border-[#695C49]/40 hover:border-[#BFA783]/60'}`}
            >
              <img src={bannerImage} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover/upload:opacity-20 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1115]/80 via-transparent to-transparent z-10" />
              <div className="h-12 w-12 bg-[#1D292F] rounded-full flex items-center justify-center border border-[#695C49]/40 group-hover/upload:border-[#BFA783]/60 transition-all z-20">
                 <ImageIcon className={`h-5 w-5 transition-transform duration-300 group-hover/upload:scale-110 ${isDragging ? 'text-[#BFA783] scale-125' : 'text-[#BFA783]'}`} />
              </div>
              <div className="text-center relative z-20 px-6">
                <p className="text-[10px] font-bold text-[#F5F3EF] uppercase tracking-widest mb-0.5">
                  {isDragging ? 'SOLTE PARA IMPORTAR' : 'CLIQUE OU ARRASTE PARA TROCAR A IMAGEM'}
                </p>
                <p className="text-[9px] text-[#A6ACAF] font-medium uppercase tracking-widest">Recomendado: 1920x800px</p>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-[#A6ACAF] uppercase tracking-wider px-1">Título de Impacto</Label>
                    <Input value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="bg-[#1D292F] border-[#695C49]/40 text-sm h-11 uppercase font-medium text-[#F5F3EF]" />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold text-[#A6ACAF] uppercase tracking-wider px-1">Texto do CTA</Label>
                    <Input value={bannerButton} onChange={e => setBannerButton(e.target.value)} className="bg-[#1D292F] border-[#695C49]/40 text-sm h-11 uppercase font-medium text-[#F5F3EF]" />
                 </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-[#A6ACAF] uppercase tracking-wider px-1">Narrativa do Banner (Subtítulo)</Label>
                <Input value={bannerSubtitle} onChange={e => setBannerSubtitle(e.target.value)} className="bg-[#1D292F] border-[#695C49]/40 text-sm h-11 font-medium text-[#F5F3EF]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold text-[#A6ACAF] uppercase tracking-wider px-1">Endereço da Imagem (URL ou Upload)</Label>
                <Input value={bannerImage} onChange={e => setBannerImage(e.target.value)} className="bg-[#1D292F] border-[#695C49]/40 text-xs h-10 font-mono text-[#A6ACAF]" placeholder="https://..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[#172127]/90 border-[#695C49]/30 overflow-hidden">
            <CardHeader className="border-b border-[#695C49]/20 bg-[#1D292F]/40 p-6">
              <CardTitle className="text-[#F5F3EF] font-serif font-medium text-base">Organização Modular da Home</CardTitle>
              <CardDescription className="text-[#A6ACAF] text-xs">Arraste para definir a hierarquia das seções pedagógicas.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections} strategy={verticalListSortingStrategy}>
                  {sections.map((section) => (
                    <SortableSectionItem key={section.id} id={section.id} section={section} toggleSection={toggleSection} />
                  ))}
                </SortableContext>
              </DndContext>
              <div className="mt-6 p-4 bg-[#1D292F]/80 border border-[#695C49]/30 rounded-xl flex items-start gap-3">
                 <div className="h-7 w-7 bg-[#BFA783]/10 rounded-lg flex items-center justify-center border border-[#BFA783]/30 shrink-0 mt-0.5">
                    <Info className="h-3.5 w-3.5 text-[#BFA783]" />
                 </div>
                 <p className="text-[11px] text-[#A6ACAF] leading-relaxed">As seções são dinâmicas. Ao salvar, as alterações ficam visíveis imediatamente para todos os membros na página inicial.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12 space-y-6">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 bg-[#172127] rounded-full flex items-center justify-center border border-[#695C49]/30">
              <Play className="h-4 w-4 text-[#BFA783]" />
           </div>
           <div>
              <h3 className="text-xl font-serif font-medium text-[#F5F3EF] uppercase tracking-tight">Cenário de Visualização (Preview)</h3>
              <p className="text-[#A6ACAF] text-[9px] font-semibold uppercase tracking-[0.2em]">Simulação em tempo real da Home do Aluno</p>
           </div>
        </div>
        
        <div className="w-full border border-[#695C49]/30 rounded-2xl overflow-hidden shadow-[0_12px_50px_rgba(0,0,0,0.6)] bg-[#0A1115] relative h-[650px] overflow-y-auto custom-scrollbar group/preview">
          <div className="sticky top-0 w-full h-16 bg-[#0A1115]/90 backdrop-blur-xl z-50 px-8 flex items-center pointer-events-none border-b border-[#695C49]/20">
             <div className="h-8 w-8 bg-[#172127] rounded-lg flex items-center justify-center border border-[#695C49]/40 mr-3">
               <GraduationCap className="h-4 w-4 text-[#BFA783]" />
             </div>
             <div className="font-serif font-medium text-[#F5F3EF] tracking-wider text-lg">FLEGON <span className="text-[#BFA783]">MEMBERS</span></div>
          </div>
          
          <div className="relative w-full h-[450px] flex items-end pb-16 group/hero">
            <img 
              src={bannerImage || 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80'}
              alt="Banner Preview" 
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover/preview:scale-[1.02] transition-transform duration-[2000ms]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A1115] via-[#0A1115]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1115] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-[#0A1115] to-transparent pointer-events-none" />
            
            <div className="relative z-10 px-8 md:px-12 w-full flex flex-col items-center text-center">
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-2">
                  <Badge variant="outline" className="px-4 py-0.5 text-[8px] tracking-[0.3em] font-semibold uppercase border-[#695C49]/60 bg-[#172127]/80 text-[#E9DDC9]">
                    ÁREA DE MEMBROS
                  </Badge>
                  <div className="h-6 w-[1px] bg-gradient-to-b from-[#BFA783]/60 to-transparent" />
                </div>
                
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-light text-[#F5F3EF] leading-tight tracking-tight uppercase">
                  {(bannerTitle || 'BODY SCULPT MENTORIA').split(' ').map((word: string, i: number) => (
                    <span key={i} className={i % 2 === 0 ? "inline-block mr-2" : "inline-block mr-2 text-transparent bg-clip-text bg-gradient-to-b from-[#BFA783] to-[#E9DDC9]"}>
                      {word}
                    </span>
                  ))}
                </h1>
                
                <p className="text-xs md:text-sm text-[#A6ACAF] font-normal leading-relaxed max-w-xl mx-auto">
                   {bannerSubtitle}
                </p>
                
                <div className="pt-2">
                  <Button variant="premium" className="h-10 px-8 text-xs font-semibold uppercase tracking-widest">
                     {bannerButton || 'INICIAR JORNADA'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
