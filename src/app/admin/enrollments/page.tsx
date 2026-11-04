import { BookOpenCheck, Link as LinkIcon, AlertCircle, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStudentsAction } from '@/app/admin/students/actions';
import { EnrollmentActionsClient } from '@/components/admin/enrollment-actions-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminEnrollments() {
  const allUsers = await getStudentsAction();
  // Mostra membros e médicos com cadastro (aprovados ou pendentes)
  const users = allUsers.filter((u) => u.role !== 'admin' || allUsers.length <= 1);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#BFA783] mb-2">
            <BookOpenCheck className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Gestão de Ativos</span>
          </div>
          <h2 className="text-4xl font-heading font-bold tracking-tight text-[#F5F3EF] uppercase">Controle de Matrículas</h2>
          <p className="text-[#A6ACAF] text-sm mt-1">Monitoramento de vigência e status de planos ativos.</p>
        </div>
        <Button variant="premium" className="h-10 text-[10px] font-bold tracking-widest uppercase px-6">
          <LinkIcon className="mr-2 h-4 w-4" /> VINCULAR ALUNO
        </Button>
      </div>

      <Card className="bg-[#172127]/90 border border-[#695C49]/25 backdrop-blur-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#695C49]/20 bg-[#1D292F]/40 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F5F3EF] uppercase tracking-widest">Registros de Matrícula</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-[9px] font-bold tracking-widest uppercase hover:bg-white/5 text-[#A6ACAF]">
              Filtros Avançados
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-[#0A1115]/50 border-b border-[#695C49]/20">
            <TableRow className="border-[#695C49]/20 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest py-4 px-6">Beneficiário</TableHead>
              <TableHead className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest py-4">Programa Habilitado</TableHead>
              <TableHead className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest py-4 text-center">Data de Ingresso</TableHead>
              <TableHead className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest py-4 text-right px-6">Ações de Gestão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!users || users.length === 0 ? (
              <TableRow className="border-[#695C49]/20 hover:bg-transparent">
                <TableCell colSpan={4} className="h-40 text-center text-[#A6ACAF]">
                  <AlertCircle className="h-6 w-6 mx-auto mb-3 opacity-30 text-[#BFA783]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Nenhuma matrícula ativa no sistema</span>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-[#695C49]/20 hover:bg-white/[0.02] transition-colors group">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#1D292F] flex items-center justify-center border border-[#695C49]/30 group-hover:border-[#BFA783]/40 transition-all">
                        <Users className="h-4 w-4 text-[#A6ACAF] group-hover:text-[#BFA783] transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#F5F3EF] group-hover:text-[#BFA783] transition-colors">{user.name}</p>
                        <p className="text-[11px] text-[#A6ACAF] font-medium tracking-tight">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.plan_type === 'premium' ? (
                      <Badge variant="premium" className="h-5 px-2 text-[8px] tracking-[0.2em]">PLATINUM PREMIUM</Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 px-2 text-[8px] tracking-[0.2em] border-[#695C49]/40 text-[#A6ACAF] bg-[#1D292F]/40">
                        ESSENTIAL MEMBER
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <EnrollmentActionsClient 
                      user={{ 
                        id: user.id, 
                        name: user.name, 
                        email: user.email, 
                        plan_type: user.plan_type || 'basic',
                        password: user.password 
                      }} 
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
