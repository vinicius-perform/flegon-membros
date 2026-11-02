'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlegonLogo } from '@/components/ui/flegon-logo';

import { supabase } from '@/lib/supabase';
import { setSessionAction } from './actions';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Setup master admin direto no Client-Side (Evita hang da API do Next.js)
      if ((email === 'bruna@sbh.com' && password === '252501as') || email.toLowerCase().trim() === 'diego@sbh.com' || (email === 'admin@flegon.com' && password === 'flegon2026')) {
        let authUserId: string | undefined;

        // Tenta logar primeiro
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        authUserId = signInData?.user?.id;

        // Se falhar, tenta criar (SignUp)
        if (signInError) {
           const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });
           if (signUpError && !signUpError.message.includes('already')) {
              throw new Error(`Auth SignUp Erro: ${signUpError.message}`);
           }
           authUserId = signUpData?.user?.id;
           
           // Se criou mas não logou, tenta logar novamente
           if (!authUserId) {
              const { data: signInRetry } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
              authUserId = signInRetry?.user?.id;
           }
        }

        if (!authUserId) throw new Error("Erro Crítico: Não foi possível obter o ID do usuário no Auth.");

        // Atualiza a tabela com o Role = admin de forma Idempotente
        const { error: dbError } = await supabase.from('users').upsert({
           id: authUserId,
           email: email.toLowerCase().trim(),
           name: email.toLowerCase().trim() === 'diego@sbh.com' ? 'Diego' : (email === 'admin@flegon.com' ? 'Dr. Flegon' : 'Bruna'),
           password: password,
           role: 'admin',
           approval_status: 'approved'
        }, { onConflict: 'id' });

        if (dbError && dbError.code !== 'PGRST116') {
           console.error(`Erro na Tabela 'users':`, dbError.message);
        }

        await setSessionAction('admin');
        router.push('/admin/dashboard');
        return;
      }

      // Permite bypass mock para o aluno conforme requisitos
      if (email === 'aluno' || email === 'aluno@sbh.com' || email === 'aluno@flegon.com') {
        await setSessionAction('student');
        router.push('/app/home');
        return;
      }

      // Fluxo principal para estudantes logarem
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      
      if (signInError) throw new Error('Credenciais inválidas. Verifique e tente novamente.');

      // Se for diego@sbh.com, garante admin e redireciona
      if (email.toLowerCase().trim() === 'diego@sbh.com') {
        await supabase.from('users').upsert({
           id: data.user.id,
           email: 'diego@sbh.com',
           name: data.user.user_metadata?.name || 'Diego',
           role: 'admin',
           approval_status: 'approved'
        }, { onConflict: 'id' });

        await setSessionAction('admin');
        router.push('/admin/dashboard');
        return;
      }

      // Consulta os dados do usuário para verificar o papel (role) e aprovação
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role, approval_status')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Erro ao checar perfil:", profileError);
      }

      // Se tiver registro com approval_status pendente ou rejeitado
      if (userProfile) {
        if (userProfile.approval_status === 'pending') {
          await supabase.auth.signOut();
          throw new Error('Sua conta ainda está em análise pela equipe do Dr. Flegon David. Aguarde a aprovação.');
        }
        if (userProfile.approval_status === 'rejected') {
          await supabase.auth.signOut();
          throw new Error('Acesso não aprovado. Entre em contato com o suporte para mais informações.');
        }
      }

      const role = userProfile?.role === 'admin' ? 'admin' : 'student';
      await setSessionAction(role);

      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/app/home');
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
       if (password !== confirmPassword) {
         throw new Error('As senhas não coincidem.');
       }

       if (password.length < 6) {
         throw new Error('A senha deve ter no mínimo 6 caracteres.');
       }

       if (!name.trim()) {
         throw new Error('O nome completo é obrigatório.');
       }

       // Attempt to create user
       const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
         email, 
         password,
         options: {
           data: { name }
         } 
       });

       if (signUpError) {
         if (signUpError.message.includes('already')) {
            throw new Error('Este e-mail já está cadastrado.');
         }
         throw new Error(`Erro ao criar conta: ${signUpError.message}`);
       }

       if (!signUpData.user) {
         throw new Error('Erro ao criar usuário.');
       }

       // Create user profile in 'users' table
       const { error: dbError } = await supabase.from('users').upsert({
         id: signUpData.user.id,
         email: email,
         name: name,
         password: password,
         role: 'student',
         approval_status: 'pending'
       }, { onConflict: 'id' });

       if (dbError) throw new Error(`Erro ao salvar perfil no banco: ${dbError.message}`);

       setSuccessMessage('Solicitação enviada com sucesso. Aguarde a aprovação para acessar os conteúdos exclusivos.');
       
       // Force sign out in case signUp auto-logged in
       await supabase.auth.signOut();

       // Limpar
       setEmail('');
       setPassword('');
       setConfirmPassword('');
       setName('');
       
       setTimeout(() => {
         setIsRegistering(false);
         setSuccessMessage('');
       }, 5000);

    } catch (err: any) {
       setError(err.message || 'Erro inesperado no cadastro.');
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0A1115]">
      {/* Luxury Subtle Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#BFA783]/8 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[350px] bg-[#1D292F]/60 blur-[130px] rounded-full" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#BFA783_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px] px-6 py-12"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <FlegonLogo size="xl" subtitle="DR. FLEGON DAVID • BODY SCULPT" />
          </motion.div>
        </div>

        <Card className="border-[#695C49]/35 bg-[#172127]/90 backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-2xl font-serif font-medium text-[#F5F3EF]">
              {isRegistering ? 'Solicitação de Acesso' : 'Acesso Privado'}
            </CardTitle>
            <CardDescription className="text-[#A6ACAF] text-xs font-sans tracking-wide mt-1.5">
              {isRegistering ? 'Preencha seus dados para avaliação de perfil' : 'Identifique-se para acessar a área exclusiva de membros'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-8 pt-2">
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 p-4 rounded-lg bg-[#BFA783]/10 border border-[#BFA783]/30 text-[#E9DDC9] text-xs font-medium text-center"
              >
                {successMessage}
              </motion.div>
            )}

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              <div className="space-y-4">
                {isRegistering && (
                   <div className="space-y-1.5">
                     <Label htmlFor="name" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6ACAF] ml-1">
                       Nome Completo
                     </Label>
                     <Input
                       id="name"
                       type="text"
                       placeholder="Dr(a). Seu Nome"
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       required={isRegistering}
                       disabled={loading}
                       className="h-11 border-[#695C49]/40 bg-[#1D292F]/80 focus-visible:border-[#BFA783] text-sm"
                     />
                   </div>
                )}
                
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6ACAF] ml-1">
                    {isRegistering ? 'Email Profissional' : 'Email de Acesso'}
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6ACAF]/60 group-focus-within:text-[#BFA783] transition-colors" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="medico@flegon.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-11 h-11 border-[#695C49]/40 bg-[#1D292F]/80 focus-visible:border-[#BFA783] text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6ACAF]">
                      Senha
                    </Label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6ACAF]/60 group-focus-within:text-[#BFA783] transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-11 h-11 border-[#695C49]/40 bg-[#1D292F]/80 focus-visible:border-[#BFA783] text-sm"
                    />
                  </div>
                </div>

                {isRegistering && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6ACAF] ml-1">
                      Confirmar Senha
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6ACAF]/60 group-focus-within:text-[#BFA783] transition-colors" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={isRegistering}
                        disabled={loading}
                        className="pl-11 h-11 border-[#695C49]/40 bg-[#1D292F]/80 focus-visible:border-[#BFA783] text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-[#F5F3EF] text-center bg-[#8B2E2E]/20 py-2.5 px-3 rounded-lg border border-[#8B2E2E]/40"
                >
                  {error}
                </motion.p>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                variant="premium"
                className="w-full h-11 text-xs font-semibold uppercase tracking-[0.2em] mt-3"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#0A1115]/40 border-t-[#0A1115] rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </div>
                ) : (isRegistering ? 'Enviar Solicitação' : 'Entrar na Plataforma')}
              </Button>

              <div className="text-center pt-3 border-t border-[#695C49]/20 mt-5">
               {isRegistering ? (
                 <p className="text-xs text-[#A6ACAF]">
                   Já possui credencial?{' '}
                   <button 
                     type="button" 
                     onClick={() => { setIsRegistering(false); setError(''); setSuccessMessage(''); }} 
                     className="text-[#BFA783] hover:text-[#E9DDC9] font-medium transition-colors ml-1 uppercase tracking-wider text-[11px]"
                   >
                     Entrar
                   </button>
                 </p>
               ) : (
                 <p className="text-xs text-[#A6ACAF]">
                   Ainda não é membro?{' '}
                   <button 
                     type="button" 
                     onClick={() => { setIsRegistering(true); setError(''); setSuccessMessage(''); }} 
                     className="text-[#BFA783] hover:text-[#E9DDC9] font-medium transition-colors ml-1 uppercase tracking-wider text-[11px]"
                   >
                     Solicitar Acesso
                   </button>
                 </p>
               )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Institutional Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-[10px] text-[#A6ACAF]/60 uppercase tracking-[0.22em] font-medium"
        >
          Dr. Flegon David • Body Sculpt Mentoria • Todos os direitos reservados
        </motion.p>
      </motion.div>
    </div>
  );
}
