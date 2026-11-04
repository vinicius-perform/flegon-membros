'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { updateStudentAction, deleteStudentAction } from '@/app/admin/students/actions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function updateEnrollmentAction(
  userId: string,
  data: {
    plan_type?: 'basic' | 'premium';
    name?: string;
    password?: string;
    approval_status?: 'approved' | 'rejected' | 'pending';
  }
) {
  try {
    // 1. Atualiza no store consolidado (nuvem + local + cache)
    const result = await updateStudentAction(userId, {
      name: data.name,
      plan_type: data.plan_type,
      password: data.password,
      approval_status: data.approval_status,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // 2. Se houver Supabase ativo, atualiza também
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        if (data.password && data.password.trim() !== '') {
          await supabase.auth.admin.updateUserById(userId, {
            password: data.password,
          });
        }
        await supabase
          .from('users')
          .update(data)
          .eq('id', userId);
      }
    } catch {
      // Ignora erro do Supabase
    }

    revalidatePath('/admin/enrollments');
    revalidatePath('/admin/students');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating enrollment:', error);
    return { success: false, error: error.message };
  }
}

export async function revokeEnrollmentAction(userId: string) {
  try {
    const result = await deleteStudentAction(userId);
    if (!result.success) {
      throw new Error(result.error);
    }

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        await supabase.from('users').delete().eq('id', userId);
      }
    } catch {
      // Ignora erro do Supabase
    }

    revalidatePath('/admin/enrollments');
    revalidatePath('/admin/students');
    return { success: true };
  } catch (error: any) {
    console.error('Error revoking enrollment:', error);
    return { success: false, error: error.message };
  }
}
