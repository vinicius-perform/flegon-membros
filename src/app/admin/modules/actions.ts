'use server';

import { revalidatePath } from 'next/cache';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase';

const CLOUD_MODULES_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1a6c1ce683364';
const localModulesPath = path.join(process.cwd(), 'src', 'data', 'modules-data.json');

export interface LessonItem {
  id: string;
  module_id?: string;
  title: string;
  video_url: string;
  is_premium?: boolean;
  order?: number;
  attachments?: any[];
}

export interface ModuleItem {
  id: string;
  title: string;
  description?: string;
  cover_image_vertical?: string | null;
  banner_image_horizontal?: string | null;
  order: number;
  status: 'active' | 'archived';
  lessons?: LessonItem[];
}

const DEFAULT_MODULES: ModuleItem[] = [
  {
    id: 'mod-1',
    title: 'Módulo 1: Fundamentos da Body Sculpt & Anatomia Aplicada',
    description: 'Princípios essenciais de escultura corporal e análise anatômica de precisão com Dr. Flegon David.',
    cover_image_vertical: 'https://jornalocandeeiro.com.br/painel/app/images/blogCapa/54651/Foto%20-%20Divulga%C3%A7%C3%A3o_Ascom%20HCRSF%20(3).jpeg',
    banner_image_horizontal: 'https://jornalocandeeiro.com.br/painel/app/images/blogCapa/54651/Foto%20-%20Divulga%C3%A7%C3%A3o_Ascom%20HCRSF%20(3).jpeg',
    order: 0,
    status: 'active',
    lessons: [
      {
        id: 'les-1',
        title: 'Aula Inaugural: Visão Geral e Filosofia Body Sculpt',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        is_premium: false,
        order: 0,
      },
      {
        id: 'les-2',
        title: 'Anatomia Topográfica e Marcações Cirúrgicas de Precisão',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        is_premium: true,
        order: 1,
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'Módulo 2: Técnicas Cirúrgicas Avançadas & Refinamento',
    description: 'Passo a passo cirúrgico detalhado, marcações e técnicas proprietárias de definição corporal.',
    cover_image_vertical: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
    banner_image_horizontal: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80',
    order: 1,
    status: 'active',
    lessons: [
      {
        id: 'les-3',
        title: 'Técnica de Lipoaspiração de Alta Definição',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        is_premium: false,
        order: 0,
      },
    ],
  },
];

export async function getModulesAction(): Promise<ModuleItem[]> {
  // 1. Tentar Supabase se configurado
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const { data, error } = await supabase
        .from('modules')
        .select(`
          id, 
          title,
          description,
          cover_image_vertical,
          banner_image_horizontal,
          "order",
          status,
          lessons (
            id,
            title,
            video_url,
            is_premium,
            premium_start_date,
            release_date,
            attachments,
            "order"
          )
        `)
        .order('order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as ModuleItem[];
      }
    }
  } catch {
    // Ignora erro e usa fallback
  }

  // 2. Tentar Cloud Store
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(CLOUD_MODULES_URL, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.modules) && json.data.modules.length > 0) {
        return json.data.modules as ModuleItem[];
      }
    }
  } catch (cloudErr) {
    console.warn('Erro ao carregar módulos da nuvem:', cloudErr);
  }

  // 3. Tentar arquivo local
  try {
    const raw = await readFile(localModulesPath, 'utf8');
    const local = JSON.parse(raw);
    if (Array.isArray(local) && local.length > 0) {
      return local as ModuleItem[];
    }
  } catch {
    // Fallback silencioso
  }

  return DEFAULT_MODULES;
}

async function saveModulesList(modules: ModuleItem[]) {
  // 1. Salvar na nuvem (PATCH)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    await fetch(CLOUD_MODULES_URL, {
      method: 'PATCH',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        data: {
          modules: modules.map((m) => ({
            id: String(m.id),
            title: m.title,
            description: m.description || '',
            cover_image_vertical: m.cover_image_vertical || null,
            banner_image_horizontal: m.banner_image_horizontal || null,
            order: m.order,
            status: m.status || 'active',
            lessons: (m.lessons || []).map((l) => ({
              id: String(l.id),
              title: l.title,
              video_url: l.video_url || '',
              is_premium: Boolean(l.is_premium),
              order: l.order || 0,
            })),
          })),
        },
      }),
    });
    clearTimeout(timeout);
  } catch (cloudErr) {
    console.warn('Erro ao persistir módulos na nuvem:', cloudErr);
  }

  // 2. Salvar localmente
  try {
    await writeFile(localModulesPath, JSON.stringify(modules, null, 2), 'utf8');
  } catch {
    // Em Vercel Serverless /var/task é read-only
  }

  // 3. Revalidar rotas
  try {
    revalidatePath('/admin/modules');
    revalidatePath('/app/home');
    revalidatePath('/admin/experience');
  } catch {
    // Falha silenciosa
  }
}

export async function createModuleAction(formData: {
  title: string;
  description?: string;
  bannerUrl?: string | null;
}) {
  const currentModules = await getModulesAction();

  const newModule: ModuleItem = {
    id: `mod-${Date.now()}`,
    title: formData.title.trim(),
    description: formData.description?.trim() || '',
    cover_image_vertical: formData.bannerUrl || null,
    banner_image_horizontal: formData.bannerUrl || null,
    order: currentModules.length,
    status: 'active',
    lessons: [],
  };

  // Tenta salvar no Supabase se houver conexão ativa
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      await supabase.from('modules').insert({
        title: newModule.title,
        description: newModule.description,
        cover_image_vertical: newModule.cover_image_vertical,
        banner_image_horizontal: newModule.banner_image_horizontal,
        status: 'active',
        order: newModule.order,
      });
    }
  } catch {
    // Fallback gracioso
  }

  const updated = [...currentModules, newModule];
  await saveModulesList(updated);

  return { success: true, module: newModule };
}

export async function updateModuleAction(formData: {
  id: string;
  title: string;
  description?: string;
  bannerUrl?: string | null;
}) {
  const currentModules = await getModulesAction();

  // Tenta atualizar no Supabase se houver conexão
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      await supabase
        .from('modules')
        .update({
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          cover_image_vertical: formData.bannerUrl || null,
          banner_image_horizontal: formData.bannerUrl || null,
        })
        .eq('id', formData.id);
    }
  } catch {
    // Fallback
  }

  const updated = currentModules.map((m) =>
    String(m.id) === String(formData.id)
      ? {
          ...m,
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          cover_image_vertical: formData.bannerUrl ?? m.cover_image_vertical,
          banner_image_horizontal: formData.bannerUrl ?? m.banner_image_horizontal,
        }
      : m
  );

  await saveModulesList(updated);
  return { success: true };
}

export async function deleteModuleAction(id: string) {
  const currentModules = await getModulesAction();

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      await supabase.from('modules').delete().eq('id', id);
    }
  } catch {
    // Fallback
  }

  const updated = currentModules.filter((m) => String(m.id) !== String(id));
  await saveModulesList(updated);
  return { success: true };
}

export async function archiveModuleAction(id: string, status: 'active' | 'archived') {
  const currentModules = await getModulesAction();

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      await supabase.from('modules').update({ status }).eq('id', id);
    }
  } catch {
    // Fallback
  }

  const updated = currentModules.map((m) =>
    String(m.id) === String(id) ? { ...m, status } : m
  );
  await saveModulesList(updated);
  return { success: true };
}

export async function createLessonAction(formData: {
  moduleId: string;
  title: string;
  videoUrl: string;
  isPremium?: boolean;
}) {
  const currentModules = await getModulesAction();

  const newLesson: LessonItem = {
    id: `les-${Date.now()}`,
    module_id: formData.moduleId,
    title: formData.title.trim(),
    video_url: formData.videoUrl.trim(),
    is_premium: Boolean(formData.isPremium),
    order: 0,
  };

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      await supabase.from('lessons').insert({
        module_id: formData.moduleId,
        title: newLesson.title,
        video_url: newLesson.video_url,
        is_premium: newLesson.is_premium,
        order: newLesson.order,
      });
    }
  } catch {
    // Fallback
  }

  const updated = currentModules.map((m) => {
    if (String(m.id) === String(formData.moduleId)) {
      const lessons = m.lessons || [];
      newLesson.order = lessons.length;
      return {
        ...m,
        lessons: [...lessons, newLesson],
      };
    }
    return m;
  });

  await saveModulesList(updated);
  return { success: true, lesson: newLesson };
}

export async function deleteLessonAction(lessonId: string) {
  const currentModules = await getModulesAction();

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      await supabase.from('lessons').delete().eq('id', lessonId);
    }
  } catch {
    // Fallback
  }

  const updated = currentModules.map((m) => ({
    ...m,
    lessons: (m.lessons || []).filter((l) => String(l.id) !== String(lessonId)),
  }));

  await saveModulesList(updated);
  return { success: true };
}
