'use server';

import { revalidatePath } from 'next/cache';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase';

const INDEX_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1a795ae2c371c';
const OBJECTS_BASE_URL = 'https://api.restful-api.dev/objects';
const localModulesPath = path.join(process.cwd(), 'src', 'data', 'modules-data.json');

declare global {
  var __flegon_modules_cache: ModuleItem[] | undefined;
}

export interface LessonItem {
  id: string;
  module_id?: string;
  title: string;
  video_url: string;
  is_premium?: boolean;
  premium_start_date?: string | null;
  release_date?: string | null;
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
    cover_image_vertical: 'https://i.imgur.com/xlA1qw6.png',
    banner_image_horizontal: 'https://i.imgur.com/xlA1qw6.png',
    order: 0,
    status: 'active',
    lessons: [
      {
        id: 'les-1',
        title: 'Aula Inaugural: Visão Geral e Filosofia Body Sculpt',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        is_premium: false,
        order: 0,
        attachments: [],
      },
      {
        id: 'les-2',
        title: 'Anatomia Topográfica e Marcações Cirúrgicas de Precisão',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        is_premium: true,
        order: 1,
        attachments: [],
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
        attachments: [],
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
        global.__flegon_modules_cache = data as ModuleItem[];
        return data as ModuleItem[];
      }
    }
  } catch {}

  // 2. Tentar Cloud Store com Registro Multi-Objeto
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const indexRes = await fetch(INDEX_URL, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (indexRes.ok) {
      const indexJson = await indexRes.json();
      const registry: { id: string; objectId: string }[] = indexJson?.data?.registry || [];

      if (registry.length > 0) {
        const queryIds = registry.map((r) => `id=${r.objectId}`).join('&');
        const batchRes = await fetch(`${OBJECTS_BASE_URL}?${queryIds}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });

        if (batchRes.ok) {
          const batchJson = await batchRes.json();
          if (Array.isArray(batchJson) && batchJson.length > 0) {
            const modules: ModuleItem[] = batchJson
              .map((obj: any) => obj.data)
              .filter(Boolean)
              .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

            global.__flegon_modules_cache = modules;
            return modules;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar do registro na nuvem:', err);
  }

  // 3. Fallback em memória
  if (global.__flegon_modules_cache && global.__flegon_modules_cache.length > 0) {
    return global.__flegon_modules_cache;
  }

  // 4. Fallback: arquivo local
  try {
    const raw = await readFile(localModulesPath, 'utf8');
    const local = JSON.parse(raw);
    if (Array.isArray(local) && local.length > 0) {
      global.__flegon_modules_cache = local;
      return local as ModuleItem[];
    }
  } catch {}

  return DEFAULT_MODULES;
}

export async function getModuleWithLessonsAction(moduleId: string): Promise<{
  module: ModuleItem | null;
  lessons: LessonItem[];
}> {
  const modules = await getModulesAction();
  const cleanId = String(moduleId).trim().toLowerCase();

  let found = modules.find((m) => String(m.id).toLowerCase() === cleanId);

  if (!found) {
    if (cleanId.startsWith('mod-')) {
      const stripped = cleanId.replace('mod-', '');
      found = modules.find((m) => String(m.id).toLowerCase() === stripped);
    } else {
      found = modules.find((m) => String(m.id).toLowerCase() === `mod-${cleanId}`);
    }
  }

  if (!found && modules.length > 0) {
    found = modules[0];
  }

  if (!found) {
    return { module: null, lessons: [] };
  }

  const sortedLessons = [...(found.lessons || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return {
    module: found,
    lessons: sortedLessons,
  };
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
    cover_image_vertical: formData.bannerUrl || 'https://i.imgur.com/xlA1qw6.png',
    banner_image_horizontal: formData.bannerUrl || 'https://i.imgur.com/xlA1qw6.png',
    order: currentModules.length,
    status: 'active',
    lessons: [],
  };

  // 1. Salva objeto individual na nuvem
  let newObjectId = '';
  try {
    const createRes = await fetch(OBJECTS_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `flegon_mod_${newModule.id}`,
        data: newModule,
      }),
    });
    if (createRes.ok) {
      const createJson = await createRes.json();
      newObjectId = createJson.id;
    }
  } catch (e) {
    console.warn('Erro criando objeto do módulo:', e);
  }

  // 2. Registra no índice
  if (newObjectId) {
    try {
      const indexRes = await fetch(INDEX_URL, { cache: 'no-store' });
      let registry: { id: string; objectId: string }[] = [];
      if (indexRes.ok) {
        const indexJson = await indexRes.json();
        registry = indexJson?.data?.registry || [];
      }
      registry.push({ id: newModule.id, objectId: newObjectId });

      await fetch(INDEX_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'flegon_modules_index',
          data: { registry },
        }),
      });
    } catch (e) {
      console.warn('Erro ao atualizar índice:', e);
    }
  }

  // 3. Atualiza cache local e revalida
  const updated = [...currentModules, newModule];
  global.__flegon_modules_cache = updated;

  try {
    await writeFile(localModulesPath, JSON.stringify(updated, null, 2), 'utf8');
  } catch {}

  try {
    revalidatePath('/admin/modules');
    revalidatePath('/app/home');
    revalidatePath('/admin/experience');
  } catch {}

  return { success: true, module: newModule };
}

export async function updateModuleAction(formData: {
  id: string;
  title: string;
  description?: string;
  bannerUrl?: string | null;
}) {
  const currentModules = await getModulesAction();

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

  global.__flegon_modules_cache = updated;

  // Atualizar objeto na nuvem
  try {
    const indexRes = await fetch(INDEX_URL, { cache: 'no-store' });
    if (indexRes.ok) {
      const indexJson = await indexRes.json();
      const registry: { id: string; objectId: string }[] = indexJson?.data?.registry || [];
      const entry = registry.find((r) => String(r.id) === String(formData.id));
      if (entry) {
        const modToSave = updated.find((m) => String(m.id) === String(formData.id));
        if (modToSave) {
          await fetch(`${OBJECTS_BASE_URL}/${entry.objectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `flegon_mod_${modToSave.id}`,
              data: modToSave,
            }),
          });
        }
      }
    }
  } catch (e) {
    console.warn('Erro atualizando módulo na nuvem:', e);
  }

  try {
    await writeFile(localModulesPath, JSON.stringify(updated, null, 2), 'utf8');
  } catch {}

  try {
    revalidatePath('/admin/modules');
    revalidatePath('/app/home');
  } catch {}

  return { success: true };
}

export async function deleteModuleAction(id: string) {
  const currentModules = await getModulesAction();
  const updated = currentModules.filter((m) => String(m.id) !== String(id));
  global.__flegon_modules_cache = updated;

  try {
    const indexRes = await fetch(INDEX_URL, { cache: 'no-store' });
    if (indexRes.ok) {
      const indexJson = await indexRes.json();
      const registry: { id: string; objectId: string }[] = indexJson?.data?.registry || [];
      const filtered = registry.filter((r) => String(r.id) !== String(id));

      await fetch(INDEX_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'flegon_modules_index',
          data: { registry: filtered },
        }),
      });
    }
  } catch (e) {
    console.warn('Erro ao remover módulo do registro:', e);
  }

  try {
    await writeFile(localModulesPath, JSON.stringify(updated, null, 2), 'utf8');
  } catch {}

  try {
    revalidatePath('/admin/modules');
    revalidatePath('/app/home');
  } catch {}

  return { success: true };
}

export async function archiveModuleAction(id: string, status: 'active' | 'archived') {
  const currentModules = await getModulesAction();
  const updated = currentModules.map((m) =>
    String(m.id) === String(id) ? { ...m, status } : m
  );
  global.__flegon_modules_cache = updated;

  try {
    const indexRes = await fetch(INDEX_URL, { cache: 'no-store' });
    if (indexRes.ok) {
      const indexJson = await indexRes.json();
      const registry: { id: string; objectId: string }[] = indexJson?.data?.registry || [];
      const entry = registry.find((r) => String(r.id) === String(id));
      if (entry) {
        const modToSave = updated.find((m) => String(m.id) === String(id));
        if (modToSave) {
          await fetch(`${OBJECTS_BASE_URL}/${entry.objectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `flegon_mod_${modToSave.id}`,
              data: modToSave,
            }),
          });
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao arquivar módulo na nuvem:', e);
  }

  try {
    await writeFile(localModulesPath, JSON.stringify(updated, null, 2), 'utf8');
  } catch {}

  try {
    revalidatePath('/admin/modules');
    revalidatePath('/app/home');
  } catch {}

  return { success: true };
}

export async function createLessonAction(formData: {
  moduleId: string;
  title: string;
  videoUrl: string;
  isPremium?: boolean;
  premiumStartDate?: string | null;
  releaseDate?: string | null;
  attachments?: any[];
}) {
  const currentModules = await getModulesAction();

  const newLesson: LessonItem = {
    id: `les-${Date.now()}`,
    module_id: formData.moduleId,
    title: formData.title.trim(),
    video_url: formData.videoUrl.trim(),
    is_premium: Boolean(formData.isPremium),
    premium_start_date: formData.premiumStartDate || null,
    release_date: formData.releaseDate || null,
    attachments: formData.attachments || [],
    order: 0,
  };

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

  global.__flegon_modules_cache = updated;

  // Atualizar objeto do módulo na nuvem
  try {
    const indexRes = await fetch(INDEX_URL, { cache: 'no-store' });
    if (indexRes.ok) {
      const indexJson = await indexRes.json();
      const registry: { id: string; objectId: string }[] = indexJson?.data?.registry || [];
      const entry = registry.find((r) => String(r.id) === String(formData.moduleId));
      if (entry) {
        const modToSave = updated.find((m) => String(m.id) === String(formData.moduleId));
        if (modToSave) {
          await fetch(`${OBJECTS_BASE_URL}/${entry.objectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `flegon_mod_${modToSave.id}`,
              data: modToSave,
            }),
          });
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao salvar aula na nuvem:', e);
  }

  try {
    await writeFile(localModulesPath, JSON.stringify(updated, null, 2), 'utf8');
  } catch {}

  try {
    revalidatePath('/admin/modules');
    revalidatePath('/app/home');
    revalidatePath(`/app/module/${formData.moduleId}/lesson/first`);
  } catch {}

  return { success: true, lesson: newLesson };
}

export async function updateLessonAction(formData: {
  id: string;
  moduleId?: string;
  title: string;
  videoUrl: string;
  isPremium?: boolean;
  premiumStartDate?: string | null;
  releaseDate?: string | null;
  attachments?: any[];
}) {
  const currentModules = await getModulesAction();

  let targetModuleId = formData.moduleId;
  if (!targetModuleId) {
    const foundModule = currentModules.find((m) =>
      (m.lessons || []).some((l) => String(l.id) === String(formData.id))
    );
    if (foundModule) targetModuleId = foundModule.id;
  }

  const updated = currentModules.map((m) => ({
    ...m,
    lessons: (m.lessons || []).map((l) =>
      String(l.id) === String(formData.id)
        ? {
            ...l,
            title: formData.title.trim(),
            video_url: formData.videoUrl.trim(),
            is_premium: Boolean(formData.isPremium),
            premium_start_date:
              formData.premiumStartDate !== undefined
                ? formData.premiumStartDate
                : l.premium_start_date,
            release_date:
              formData.releaseDate !== undefined ? formData.releaseDate : l.release_date,
            attachments: formData.attachments || l.attachments || [],
          }
        : l
    ),
  }));

  global.__flegon_modules_cache = updated;

  // Atualizar módulo na nuvem
  if (targetModuleId) {
    try {
      const indexRes = await fetch(INDEX_URL, { cache: 'no-store' });
      if (indexRes.ok) {
        const indexJson = await indexRes.json();
        const registry: { id: string; objectId: string }[] = indexJson?.data?.registry || [];
        const entry = registry.find((r) => String(r.id) === String(targetModuleId));
        if (entry) {
          const modToSave = updated.find((m) => String(m.id) === String(targetModuleId));
          if (modToSave) {
            await fetch(`${OBJECTS_BASE_URL}/${entry.objectId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: `flegon_mod_${modToSave.id}`,
                data: modToSave,
              }),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao atualizar aula na nuvem:', e);
    }
  }

  try {
    await writeFile(localModulesPath, JSON.stringify(updated, null, 2), 'utf8');
  } catch {}

  try {
    revalidatePath('/admin/modules');
    revalidatePath('/app/home');
  } catch {}

  return { success: true };
}

export async function deleteLessonAction(lessonId: string) {
  const currentModules = await getModulesAction();

  let targetModuleId: string | undefined;
  const foundModule = currentModules.find((m) =>
    (m.lessons || []).some((l) => String(l.id) === String(lessonId))
  );
  if (foundModule) targetModuleId = foundModule.id;

  const updated = currentModules.map((m) => ({
    ...m,
    lessons: (m.lessons || []).filter((l) => String(l.id) !== String(lessonId)),
  }));

  global.__flegon_modules_cache = updated;

  if (targetModuleId) {
    try {
      const indexRes = await fetch(INDEX_URL, { cache: 'no-store' });
      if (indexRes.ok) {
        const indexJson = await indexRes.json();
        const registry: { id: string; objectId: string }[] = indexJson?.data?.registry || [];
        const entry = registry.find((r) => String(r.id) === String(targetModuleId));
        if (entry) {
          const modToSave = updated.find((m) => String(m.id) === String(targetModuleId));
          if (modToSave) {
            await fetch(`${OBJECTS_BASE_URL}/${entry.objectId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: `flegon_mod_${modToSave.id}`,
                data: modToSave,
              }),
            });
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao remover aula na nuvem:', e);
    }
  }

  try {
    await writeFile(localModulesPath, JSON.stringify(updated, null, 2), 'utf8');
  } catch {}

  try {
    revalidatePath('/admin/modules');
    revalidatePath('/app/home');
  } catch {}

  return { success: true };
}
