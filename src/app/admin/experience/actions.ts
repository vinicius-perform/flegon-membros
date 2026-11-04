'use server';

import { revalidatePath } from 'next/cache';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase';

const CLOUD_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1a6ae99bc32c2';
const localConfigPath = path.join(process.cwd(), 'src', 'data', 'home-config.json');

export interface HomeConfigData {
  id?: number;
  banner_title: string;
  banner_title_color?: string;
  banner_highlight_word?: string;
  banner_highlight_color?: string;
  banner_subtitle: string;
  banner_button_text: string;
  banner_image_url: string;
  sections: Array<{
    id: string;
    label: string;
    active: boolean;
  }>;
}

const DEFAULT_CONFIG: HomeConfigData = {
  id: 1,
  banner_title: 'FLEGON DAVID',
  banner_title_color: '#F5F3EF',
  banner_highlight_word: 'DAVID',
  banner_highlight_color: 'gold-gradient',
  banner_subtitle: 'Aperfeiçoamento médico e refinamento técnico cirúrgico de alto nível com o Dr. Flegon David.',
  banner_button_text: 'INICIAR JORNADA',
  banner_image_url: 'https://jornalocandeeiro.com.br/painel/app/images/blogCapa/54651/Foto%20-%20Divulga%C3%A7%C3%A3o_Ascom%20HCRSF%20(3).jpeg',
  sections: [
    { id: 'highlight_modules', label: 'Módulos em Destaque', active: false },
    { id: 'recent_lessons', label: 'Trilha de Aprendizado', active: false },
  ],
};

export async function getHomeConfigAction(): Promise<HomeConfigData> {
  // 1. Tenta buscar no Supabase se houver credenciais ativas
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const { data, error } = await supabase.from('home_config').select('*').eq('id', 1).single();
      if (!error && data && data.banner_title) {
        return data as HomeConfigData;
      }
    }
  } catch {
    // Ignora erro do Supabase e avança
  }

  // 2. Busca na persistência em nuvem (disponível globalmente na Vercel e produção)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(CLOUD_STORE_URL, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json && json.data && json.data.banner_title) {
        return json.data as HomeConfigData;
      }
    }
  } catch (cloudErr) {
    console.warn('Persistência cloud indisponível, usando fallback:', cloudErr);
  }

  // 3. Fallback para arquivo local se estiver em dev ou se nuvem falhar
  try {
    const raw = await readFile(localConfigPath, 'utf8');
    const local = JSON.parse(raw);
    if (local && local.banner_title) {
      return local as HomeConfigData;
    }
  } catch {
    // Falha silenciosa
  }

  return DEFAULT_CONFIG;
}

export async function saveHomeConfigAction(data: {
  banner_title: string;
  banner_title_color?: string;
  banner_highlight_word?: string;
  banner_highlight_color?: string;
  banner_subtitle: string;
  banner_button_text: string;
  banner_image_url: string;
  sections: any[];
}) {
  const payload: HomeConfigData = {
    id: 1,
    banner_title: data.banner_title,
    banner_title_color: data.banner_title_color || '#F5F3EF',
    banner_highlight_word: data.banner_highlight_word || '',
    banner_highlight_color: data.banner_highlight_color || 'gold-gradient',
    banner_subtitle: data.banner_subtitle,
    banner_button_text: data.banner_button_text,
    banner_image_url: data.banner_image_url,
    sections: data.sections,
  };

  let savedInSupabase = false;
  let savedInCloud = false;

  // 1. Tenta salvar no Supabase
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const { error } = await supabase.from('home_config').upsert(payload, { onConflict: 'id' });
      if (!error) {
        savedInSupabase = true;
      }
    }
  } catch {
    // Supabase não configurado
  }

  // 2. Salva na persistência em nuvem (garante que todos os usuários Vercel vejam na hora)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const cloudRes = await fetch(CLOUD_STORE_URL, {
      method: 'PUT',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        name: 'flegon_config',
        data: payload,
      }),
    });
    clearTimeout(timeout);
    if (cloudRes.ok) {
      savedInCloud = true;
    }
  } catch (cloudErr) {
    console.error('Erro ao sincronizar na nuvem:', cloudErr);
  }

  // 3. Tenta salvar no arquivo local (funciona em dev; em Vercel serverless não bloqueia)
  try {
    await writeFile(localConfigPath, JSON.stringify(payload, null, 2), 'utf8');
  } catch {
    // Em Vercel Serverless /var/task é read-only, o que é esperado
  }

  // 4. Revalida todas as rotas relevantes para limpar cache de borda
  try {
    revalidatePath('/app/home');
    revalidatePath('/admin/experience');
    revalidatePath('/');
  } catch {
    // Falha silenciosa
  }

  return { success: true, savedInSupabase, savedInCloud, config: payload };
}
