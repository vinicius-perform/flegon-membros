'use server';

import { revalidatePath } from 'next/cache';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase';

const localConfigPath = path.join(process.cwd(), 'src', 'data', 'home-config.json');

export async function getHomeConfigAction() {
  let config: any = null;

  // 1. Tenta buscar no Supabase
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const { data, error } = await supabase.from('home_config').select('*').eq('id', 1).single();
      if (!error && data) {
        config = data;
      }
    }
  } catch {
    // Falha silenciosa para fallback local
  }

  // 2. Fallback para arquivo local se Supabase não retornar dados
  if (!config) {
    try {
      const raw = await readFile(localConfigPath, 'utf8');
      config = JSON.parse(raw);
    } catch {
      config = {
        id: 1,
        banner_title: 'Body Sculpt Mentoria',
        banner_subtitle: 'Aperfeiçoamento médico e refinamento técnico cirúrgico de alto nível com o Dr. Flegon David.',
        banner_button_text: 'INICIAR JORNADA',
        banner_image_url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80',
        sections: [
          { id: 'highlight_modules', label: 'Módulos em Destaque', active: true },
          { id: 'recent_lessons', label: 'Trilha de Aprendizado', active: true }
        ]
      };
    }
  }

  return config;
}

export async function saveHomeConfigAction(data: {
  banner_title: string;
  banner_subtitle: string;
  banner_button_text: string;
  banner_image_url: string;
  sections: any[];
}) {
  const payload = {
    id: 1,
    banner_title: data.banner_title,
    banner_subtitle: data.banner_subtitle,
    banner_button_text: data.banner_button_text,
    banner_image_url: data.banner_image_url,
    sections: data.sections,
  };

  let savedInSupabase = false;

  // 1. Tenta salvar no Supabase
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const { error } = await supabase.from('home_config').upsert(payload, { onConflict: 'id' });
      if (!error) {
        savedInSupabase = true;
      }
    }
  } catch {
    // Supabase indisponível no mock local
  }

  // 2. Sempre persiste no arquivo local
  try {
    await writeFile(localConfigPath, JSON.stringify(payload, null, 2), 'utf8');
  } catch (fsErr) {
    console.error('Erro ao salvar localmente:', fsErr);
  }

  // 3. Revalida caches
  revalidatePath('/app/home');
  revalidatePath('/admin/experience');

  return { success: true, savedInSupabase };
}
