'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { setSessionAction } from '@/app/actions';
import {
  type StudentRecord,
  saveLocalStudents,
  readLocalStudents,
  syncWithCloud,
  fetchStudentsFromCloud,
} from '@/lib/students-store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getStudentsAction(): Promise<StudentRecord[]> {
  const fromCloud = await fetchStudentsFromCloud();
  if (fromCloud && fromCloud.length > 0) {
    return fromCloud;
  }

  if (global.__flegon_students_cache && global.__flegon_students_cache.length > 0) {
    return global.__flegon_students_cache;
  }

  const local = readLocalStudents();
  global.__flegon_students_cache = local;
  return local;
}

export async function approveStudentAction(userId: string) {
  try {
    const list = await getStudentsAction();
    const updated = list.map((st) =>
      st.id === userId || st.email.toLowerCase() === userId.toLowerCase()
        ? { ...st, approval_status: 'approved' as const }
        : st
    );

    saveLocalStudents(updated);
    await syncWithCloud(updated);

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        await supabase
          .from('users')
          .update({ approval_status: 'approved' })
          .or(`id.eq.${userId},email.eq.${userId}`);
      }
    } catch {}

    revalidatePath('/admin/students');
    revalidatePath('/admin/enrollments');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error('Error approving student:', error);
    return { success: false, error: error.message || 'Falha ao aprovar aluno.' };
  }
}

export async function rejectStudentAction(userId: string) {
  try {
    const list = await getStudentsAction();
    const updated = list.map((st) =>
      st.id === userId || st.email.toLowerCase() === userId.toLowerCase()
        ? { ...st, approval_status: 'rejected' as const }
        : st
    );

    saveLocalStudents(updated);
    await syncWithCloud(updated);

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        await supabase
          .from('users')
          .update({ approval_status: 'rejected' })
          .or(`id.eq.${userId},email.eq.${userId}`);
      }
    } catch {}

    revalidatePath('/admin/students');
    revalidatePath('/admin/enrollments');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting student:', error);
    return { success: false, error: error.message || 'Falha ao rejeitar aluno.' };
  }
}

export async function updateStudentAction(
  userId: string,
  data: {
    name?: string;
    approval_status?: 'pending' | 'approved' | 'rejected';
    plan_type?: 'basic' | 'premium';
    password?: string;
  }
) {
  try {
    const list = await getStudentsAction();
    const updated = list.map((st) => {
      if (st.id === userId || st.email.toLowerCase() === userId.toLowerCase()) {
        return {
          ...st,
          name: data.name ?? st.name,
          approval_status: data.approval_status ?? st.approval_status,
          plan_type: data.plan_type ?? st.plan_type,
          password: data.password !== undefined && data.password.trim() !== '' ? data.password : st.password,
        };
      }
      return st;
    });

    saveLocalStudents(updated);
    await syncWithCloud(updated);

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        const updatePayload: any = {};
        if (data.name) updatePayload.name = data.name;
        if (data.approval_status) updatePayload.approval_status = data.approval_status;
        if (data.plan_type) updatePayload.plan_type = data.plan_type;
        if (data.password) updatePayload.password = data.password;

        await supabase
          .from('users')
          .update(updatePayload)
          .or(`id.eq.${userId},email.eq.${userId}`);
      }
    } catch {}

    revalidatePath('/admin/students');
    revalidatePath('/admin/enrollments');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message || 'Falha ao atualizar aluno.' };
  }
}

export async function deleteStudentAction(userId: string) {
  try {
    const list = await getStudentsAction();
    const updated = list.filter((st) => st.id !== userId && st.email.toLowerCase() !== userId.toLowerCase());

    saveLocalStudents(updated);
    await syncWithCloud(updated);

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        await supabase.from('users').delete().or(`id.eq.${userId},email.eq.${userId}`);
      }
    } catch {}

    revalidatePath('/admin/students');
    revalidatePath('/admin/enrollments');
    revalidatePath('/admin/dashboard');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return { success: false, error: error.message || 'Falha ao excluir aluno.' };
  }
}

export async function createDoctorAction(formData: {
  name: string;
  email: string;
  password: string;
  crm?: string;
  plan_type?: 'basic' | 'premium';
  role?: 'student' | 'admin';
}) {
  try {
    const email = formData.email.toLowerCase().trim();
    const password = formData.password.trim();
    const name = formData.name.trim();
    const plan_type = formData.plan_type || 'basic';
    const role = formData.role || 'student';

    if (!email || !password || !name) {
      return { success: false, error: 'Nome, e-mail e senha são obrigatórios.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' };
    }

    const list = await getStudentsAction();
    const existingIndex = list.findIndex((s) => s.email.toLowerCase() === email);

    const newStudent: StudentRecord = {
      id: `usr-${Date.now()}`,
      name,
      email,
      password,
      crm: formData.crm || '',
      role: role as 'student' | 'admin',
      plan_type: plan_type as 'basic' | 'premium',
      approval_status: 'approved',
      created_at: new Date().toISOString(),
    };

    let updatedList: StudentRecord[];
    if (existingIndex >= 0) {
      updatedList = list.map((s, idx) => (idx === existingIndex ? newStudent : s));
    } else {
      updatedList = [newStudent, ...list];
    }

    saveLocalStudents(updatedList);
    await syncWithCloud(updatedList);

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        const { data: signUpData } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, crm: formData.crm } },
        });

        const authUserId = signUpData?.user?.id || newStudent.id;
        await supabase.from('users').upsert(
          {
            id: authUserId,
            email,
            name,
            password,
            role,
            plan_type,
            approval_status: 'approved',
          },
          { onConflict: 'id' }
        );
      }
    } catch {}

    revalidatePath('/admin/students');
    revalidatePath('/admin/enrollments');
    revalidatePath('/admin/dashboard');

    return { success: true, user: newStudent };
  } catch (error: any) {
    console.error('Error creating doctor:', error);
    return { success: false, error: error.message || 'Erro inesperado ao cadastrar médico.' };
  }
}

export async function authenticateUserAction(emailInput: string, passwordInput: string) {
  const cleanEmail = emailInput.toLowerCase().trim();
  const cleanPassword = passwordInput.trim();

  // 1. Admin fixo de demonstração
  if (
    cleanEmail === 'admin@flegon.com' ||
    cleanEmail === 'admin' ||
    (cleanEmail === 'bruna@sbh.com' && cleanPassword === '252501as') ||
    cleanEmail === 'diego@sbh.com'
  ) {
    await setSessionAction('admin');
    return { success: true, role: 'admin', redirect: '/admin/dashboard' };
  }

  // 2. Membro fixo de demonstração
  if (
    cleanEmail === 'membro@flegon.com' ||
    cleanEmail === 'aluno@flegon.com' ||
    cleanEmail === 'aluno@sbh.com' ||
    cleanEmail === 'aluno' ||
    cleanEmail === 'membro'
  ) {
    await setSessionAction('student');
    return { success: true, role: 'student', redirect: '/app/home' };
  }

  // 3. Consulta na lista de estudantes consolidada
  const list = await getStudentsAction();
  const matched = list.find((s) => s.email.toLowerCase() === cleanEmail);

  if (matched) {
    if (matched.approval_status === 'pending') {
      return {
        success: false,
        error: 'Sua solicitação de acesso ainda está em análise pela equipe do Dr. Flegon David. Aguarde a aprovação.',
      };
    }

    if (matched.approval_status === 'rejected') {
      return {
        success: false,
        error: 'Solicitação de acesso não aprovada. Entre em contato com a nossa equipe de suporte.',
      };
    }

    // Se possui senha cadastrada, valida
    if (matched.password && matched.password !== cleanPassword) {
      return {
        success: false,
        error: 'Senha incorreta. Verifique e tente novamente.',
      };
    }

    const userRole = matched.role === 'admin' ? 'admin' : 'student';
    await setSessionAction(userRole);

    return {
      success: true,
      role: userRole,
      redirect: userRole === 'admin' ? '/admin/dashboard' : '/app/home',
    };
  }

  // 4. Se não achou na lista direta, tenta Supabase Auth
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!signInError && data?.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role, approval_status')
          .eq('id', data.user.id)
          .single();

        if (userProfile?.approval_status === 'pending') {
          return {
            success: false,
            error: 'Sua conta ainda está em análise pela equipe do Dr. Flegon David.',
          };
        }

        const role = userProfile?.role === 'admin' ? 'admin' : 'student';
        await setSessionAction(role);
        return {
          success: true,
          role,
          redirect: role === 'admin' ? '/admin/dashboard' : '/app/home',
        };
      }
    }
  } catch {}

  return {
    success: false,
    error: 'Credenciais inválidas. Verifique os dados ou solicite seu acesso.',
  };
}
