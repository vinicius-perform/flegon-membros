'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldCheck, UserCheck, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FlegonLogo } from '@/components/ui/flegon-logo';

import { supabase } from '@/lib/supabase';
import { setSessionAction } from './actions';
import { registerAccessRequestAction } from './actions/register-action';
import { authenticateUserAction } from './admin/students/actions';

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

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    try {
      const authRes = await authenticateUserAction(cleanEmail, cleanPassword);
      if (!authRes.success) {
        throw new Error(authRes.error || 'Credenciais inválidas. Verifique seus dados.');
      }

      router.push(authRes.redirect || '/app/home');
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

      if (!email.trim() || !email.includes('@')) {
        throw new Error('Por favor, informe um e-mail válido.');
      }

      const res = await registerAccessRequestAction({
        name,
        email,
        password,
      });

      if (!res.success) {
        throw new Error(res.error || 'Erro ao registrar solicitação.');
      }

      setSuccessMessage('Solicitação enviada com sucesso! Seus dados foram recebidos pela equipe do Dr. Flegon David e estão em análise para liberação do acesso.');

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

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0A1115]">
      {/* Luxury Subtle Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#BFA783]/8 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[350px] bg-[#1D292F]/60 blur-[130px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#BFA783_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[460px] px-6 py-12"
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
              {isRegistering
                ? 'Preencha seus dados para avaliação de perfil'
                : 'Identifique-se para acessar a área exclusiva de membros'}
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
                      placeholder="seu@email.com"
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
                ) : (
                  isRegistering ? 'Enviar Solicitação' : 'Entrar na Plataforma'
                )}
              </Button>

              {/* Bloco de Apresentação do Sistema: Credenciais de Demonstração */}
              {!isRegistering && (
                <div className="pt-4 mt-3 border-t border-[#695C49]/25 space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="h-3 w-3 text-[#BFA783]" />
                      <span className="text-[9px] uppercase tracking-[0.22em] text-[#E9DDC9] font-semibold">
                        Apresentação do Sistema
                      </span>
                    </div>
                    <span className="text-[8px] text-[#A6ACAF] font-medium">Toque para preencher</span>
                  </div>

                  <div className="space-y-2">
                    {/* Credencial Admin */}
                    <div
                      onClick={() => fillCredentials('admin@flegon.com', 'flegon2026')}
                      className="group p-2.5 rounded-lg bg-[#1D292F]/90 border border-[#695C49]/35 hover:border-[#BFA783] transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded bg-[#BFA783]/15 border border-[#BFA783]/30 flex items-center justify-center shrink-0 group-hover:bg-[#BFA783]/25">
                          <ShieldCheck className="h-4 w-4 text-[#BFA783]" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-[#E9DDC9] uppercase tracking-wider">Acesso Admin</span>
                            <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#BFA783]/20 text-[#BFA783] font-bold">TOTAL</span>
                          </div>
                          <p className="text-[9px] text-[#A6ACAF] font-mono truncate mt-0.5">
                            admin@flegon.com • <span className="text-[#F5F3EF]">flegon2026</span>
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#A6ACAF] group-hover:text-[#BFA783] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>

                    {/* Credencial Membro / Aluno */}
                    <div
                      onClick={() => fillCredentials('membro@flegon.com', 'flegon2026')}
                      className="group p-2.5 rounded-lg bg-[#1D292F]/90 border border-[#695C49]/35 hover:border-[#BFA783] transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded bg-[#172127] border border-[#695C49]/40 flex items-center justify-center shrink-0 group-hover:border-[#BFA783]/60">
                          <UserCheck className="h-4 w-4 text-[#E9DDC9]" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-[#E9DDC9] uppercase tracking-wider">Acesso Membro</span>
                            <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#172127] text-[#A6ACAF] border border-[#695C49]/30 font-bold">ALUNO</span>
                          </div>
                          <p className="text-[9px] text-[#A6ACAF] font-mono truncate mt-0.5">
                            membro@flegon.com • <span className="text-[#F5F3EF]">flegon2026</span>
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#A6ACAF] group-hover:text-[#BFA783] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center pt-2">
                {isRegistering ? (
                  <p className="text-xs text-[#A6ACAF]">
                    Já possui credencial?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(false);
                        setError('');
                        setSuccessMessage('');
                      }}
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
                      onClick={() => {
                        setIsRegistering(true);
                        setError('');
                        setSuccessMessage('');
                      }}
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
