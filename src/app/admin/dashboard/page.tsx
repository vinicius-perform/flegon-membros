import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlaySquare, Users, Video, BookOpenCheck, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getModulesAction } from '@/app/admin/modules/actions';
import { getStudentsAction } from '@/app/admin/students/actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  const [modules, students] = await Promise.all([
    getModulesAction(),
    getStudentsAction(),
  ]);

  const modulesCount = modules?.length || 0;
  const lessonsCount = modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
  const usersCount = students?.length || 0;
  const latestUsers = students?.slice(0, 5) || [];

  const stats = [
    { title: 'Gestão de Módulos', value: modulesCount, icon: PlaySquare, description: 'Módulos estruturados', trend: 'Ativos' },
    { title: 'Comunidade Médica', value: usersCount, icon: Users, description: 'Médicos e alunos', trend: 'Verificado' },
    { title: 'Acervo de Aulas', value: lessonsCount, icon: Video, description: 'Aulas publicadas', trend: 'Auditado' },
    { title: 'Novas Matrículas', value: latestUsers.filter((u: any) => u.approval_status === 'pending').length, icon: BookOpenCheck, description: 'Pendentes de aprovação', trend: 'Auditoria' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#BFA783] mb-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em]">Visão Geral</span>
          </div>
          <h2 className="text-3xl font-serif font-medium tracking-tight text-[#F5F3EF]">Centro de Controle</h2>
          <p className="text-[#A6ACAF] text-xs mt-1">Gerenciamento estratégico da plataforma Flegon Members.</p>
        </div>
        <div className="flex gap-2.5">
          <Link href="/admin/students">
            <Button variant="outline" size="sm" className="text-[10px] tracking-wider font-semibold uppercase">
              VER MEMBROS
            </Button>
          </Link>
          <Link href="/admin/modules">
            <Button variant="premium" size="sm" className="text-[10px] tracking-wider font-semibold uppercase">
              NOVO MÓDULO
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, i) => (
          <Card key={i} className="bg-[#172127]/90 border-[#695C49]/30 hover:border-[#BFA783]/50 transition-all duration-300 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#BFA783]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[9px] font-semibold text-[#A6ACAF] uppercase tracking-[0.2em]">
                {item.title}
              </CardTitle>
              <div className="h-7 w-7 rounded-md bg-[#1D292F] flex items-center justify-center border border-[#695C49]/30">
                <item.icon className="h-3.5 w-3.5 text-[#BFA783]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-serif font-medium text-[#F5F3EF] mb-1">{item.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-[#A6ACAF]">{item.description}</p>
                <span className="text-[8px] font-semibold text-[#E9DDC9] bg-[#BFA783]/10 px-2 py-0.5 rounded-full border border-[#BFA783]/20">{item.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-[#172127]/90 border-[#695C49]/30 overflow-hidden">
          <CardHeader className="border-b border-[#695C49]/20 bg-[#1D292F]/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#F5F3EF] font-serif font-medium text-base">Fluxo de Engajamento</CardTitle>
                <CardDescription className="text-[#A6ACAF] text-xs">Acompanhamento de acessos médicos</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-[#BFA783]" />
                <div className="h-2 w-2 rounded-full bg-[#1D292F]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] flex items-center justify-center p-0 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(191,167,131,0.04),transparent)] pointer-events-none" />
            <div className="flex flex-col items-center gap-3 relative z-10">
              <div className="h-12 w-12 bg-[#1D292F] rounded-full flex items-center justify-center border border-[#695C49]/40">
                <TrendingUp className="h-5 w-5 text-[#BFA783]" />
              </div>
              <p className="text-[#A6ACAF] text-xs font-medium">Dados analíticos em sincronização contínua</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-[#172127]/90 border-[#695C49]/30 flex flex-col">
          <CardHeader className="border-b border-[#695C49]/20 bg-[#1D292F]/40">
            <CardTitle className="text-[#F5F3EF] font-serif font-medium text-base">Últimos Membros Inscritos</CardTitle>
            <CardDescription className="text-[#A6ACAF] text-xs">Médicos recém-admitidos na mentoria</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-[#695C49]/20">
              {!latestUsers || latestUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#A6ACAF]">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-30 text-[#BFA783]" />
                  <p className="text-[10px] uppercase tracking-widest font-semibold">Nenhum registro encontrado</p>
                </div>
              ) : (
                latestUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center gap-3.5 p-4 hover:bg-[#1D292F]/50 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-[#1D292F] flex items-center justify-center border border-[#695C49]/30">
                      <Users className="h-4 w-4 text-[#BFA783]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#F5F3EF] truncate">{user.name}</p>
                      <p className="text-[10px] text-[#A6ACAF] truncate">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-semibold text-[#A6ACAF]/70 uppercase tracking-tighter">
                        {user.approval_status === 'pending' ? 'Pendente' : 'Membro'}
                      </p>
                      <p className="text-[9px] text-[#BFA783] font-medium">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <div className="p-3 border-t border-[#695C49]/20 bg-[#1D292F]/30">
            <Link href="/admin/students" className="block w-full">
              <Button variant="ghost" className="w-full text-[9px] tracking-widest font-semibold h-9 uppercase hover:bg-[#1D292F] text-[#A6ACAF]">
                VER TODOS OS ALUNOS
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
