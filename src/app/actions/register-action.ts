'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

const CLOUD_STUDENTS_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1a6c1fd8b3365';
const STUDENTS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'students-data.json');

export async function registerAccessRequestAction(formData: {
  name: string;
  email: string;
  password?: string;
}) {
  const name = formData.name?.trim();
  const email = formData.email?.toLowerCase().trim();
  const password = formData.password?.trim() || '';

  if (!name || !email) {
    return { success: false, error: 'Nome e e-mail são obrigatórios.' };
  }

  // 1. Tenta no Supabase Auth se houver conexão ativa
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (!signUpError && signUpData?.user) {
        await supabase.from('users').upsert(
          {
            id: signUpData.user.id,
            email,
            name,
            password,
            role: 'student',
            plan_type: 'basic',
            approval_status: 'pending',
          },
          { onConflict: 'id' }
        );
      }
    }
  } catch (authErr) {
    console.warn('Supabase Auth indisponível para registro:', authErr);
  }

  // 2. Persiste a solicitação na lista de estudantes da nuvem e no cache local
  try {
    const res = await fetch(CLOUD_STUDENTS_URL, { cache: 'no-store' });
    let existingStudents: any[] = [];
    if (res.ok) {
      const json = await res.json();
      existingStudents = json.data?.students || [];
    }

    const newStudent = {
      id: `usr-${Date.now()}`,
      name,
      email,
      password,
      role: 'student',
      plan_type: 'basic',
      approval_status: 'pending',
      created_at: new Date().toISOString(),
    };

    const updatedList = [newStudent, ...existingStudents.filter((s: any) => s.email !== email)];

    // Atualiza nuvem
    await fetch(CLOUD_STUDENTS_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          students: updatedList,
        },
      }),
    });

    // Atualiza cache em memória e arquivo local
    try {
      (global as any).__flegon_students_cache = updatedList;
      fs.writeFileSync(STUDENTS_FILE_PATH, JSON.stringify(updatedList, null, 2), 'utf-8');
    } catch {
      // Ignora erro de escrita local
    }

    revalidatePath('/admin/students');
    revalidatePath('/admin/enrollments');
    revalidatePath('/admin/dashboard');
  } catch (cloudErr) {
    console.warn('Erro ao salvar estudante na nuvem:', cloudErr);
  }

  return {
    success: true,
    message: 'Solicitação enviada com sucesso! Aguarde a aprovação para acessar os conteúdos exclusivos.',
  };
}
