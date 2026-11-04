'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import {
  saveLocalStudents,
  syncWithCloud,
  StudentRecord,
} from '@/lib/students-store';
import { getStudentsAction } from '@/app/admin/students/actions';

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

  // 2. Persiste a solicitação no armazenamento na nuvem (Vercel Blob) e cache local
  try {
    const existing = await getStudentsAction();

    const newStudent: StudentRecord = {
      id: `usr-${Date.now()}`,
      name,
      email,
      password,
      role: 'student',
      plan_type: 'basic',
      approval_status: 'pending',
      created_at: new Date().toISOString(),
    };

    const updatedList = [
      newStudent,
      ...existing.filter((s) => s.email.toLowerCase() !== email.toLowerCase()),
    ];

    saveLocalStudents(updatedList);
    await syncWithCloud(updatedList);

    revalidatePath('/admin/students');
    revalidatePath('/admin/enrollments');
    revalidatePath('/admin/dashboard');
  } catch (cloudErr) {
    console.error('Erro ao salvar estudante:', cloudErr);
    return { success: false, error: 'Erro ao registrar solicitação. Tente novamente.' };
  }

  return {
    success: true,
    message: 'Solicitação enviada com sucesso! Aguarde a aprovação para acessar os conteúdos exclusivos.',
  };
}
