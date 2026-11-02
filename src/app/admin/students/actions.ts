'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabase = createClient(supabaseUrl, supabaseKey)

export async function createDoctorAction(formData: {
  name: string
  email: string
  password: string
  crm?: string
  plan_type?: string
  role?: string
}) {
  try {
    const email = formData.email.toLowerCase().trim()
    const password = formData.password.trim()
    const name = formData.name.trim()
    const plan_type = formData.plan_type || 'basic'
    const role = formData.role || 'student'

    if (!email || !password || !name) {
      return { success: false, error: 'Nome, e-mail e senha são obrigatórios.' }
    }

    if (password.length < 6) {
      return { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' }
    }

    let authUserId: string | undefined

    // 1. Tentar criar via Admin API (se Service Role key estiver disponível)
    try {
      const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, crm: formData.crm }
      })

      if (!adminError && adminUser?.user?.id) {
        authUserId = adminUser.user.id
      }
    } catch {
      // Ignora erro caso não possua chave service_role
    }

    // 2. Se não conseguiu via Admin API, tentar via signUp
    if (!authUserId) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, crm: formData.crm }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('already') || signUpError.message.includes('registered')) {
          // Se já está cadastrado no Auth, busca se existe na tabela users
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle()

          if (existingUser) {
            authUserId = existingUser.id
          } else {
            return { success: false, error: 'Este e-mail já está registrado na autenticação.' }
          }
        } else {
          return { success: false, error: `Erro no Supabase Auth: ${signUpError.message}` }
        }
      } else {
        authUserId = signUpData?.user?.id
      }
    }

    if (!authUserId) {
      return { success: false, error: 'Não foi possível obter o ID de autenticação do usuário.' }
    }

    // 3. Salvar/Atualizar na tabela users com aprovação imediata
    const { error: dbError } = await supabase.from('users').upsert({
      id: authUserId,
      email,
      name,
      password,
      role,
      plan_type,
      approval_status: 'approved'
    }, { onConflict: 'id' })

    if (dbError) {
      return { success: false, error: `Erro no banco de dados: ${dbError.message}` }
    }

    const newUser = {
      id: authUserId,
      email,
      name,
      password,
      role,
      plan_type,
      approval_status: 'approved',
      created_at: new Date().toISOString()
    }

    revalidatePath('/admin/students')
    revalidatePath('/admin/enrollments')
    return { success: true, user: newUser }
  } catch (error: any) {
    console.error('Error creating doctor:', error)
    return { success: false, error: error.message || 'Erro inesperado ao cadastrar médico.' }
  }
}
