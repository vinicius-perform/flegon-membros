'use client';

import { useState, useEffect } from 'react';
import { Users, GraduationCap, Plus, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StudentRecord } from '@/lib/students-store';
import {
  approveStudentAction,
  rejectStudentAction,
  updateStudentAction,
  createDoctorAction,
  getStudentsAction,
} from '@/app/admin/students/actions';

interface StudentsClientProps {
  initialUsers: StudentRecord[];
}

export function StudentsClient({ initialUsers }: StudentsClientProps) {
  const [users, setUsers] = useState<StudentRecord[]>(initialUsers || []);
  const [editingUser, setEditingUser] = useState<StudentRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editPlan, setEditPlan] = useState<'basic' | 'premium'>('basic');
  const [editPassword, setEditPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Create Doctor Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCrm, setNewCrm] = useState('');
  const [newPlan, setNewPlan] = useState<'basic' | 'premium'>('basic');
  const [newRole, setNewRole] = useState<'student' | 'admin'>('student');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const refreshStudents = async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const fresh = await getStudentsAction();
      if (Array.isArray(fresh) && fresh.length > 0) {
        setUsers(fresh);
      }
    } catch (e) {
      console.warn('Erro ao atualizar lista:', e);
    } finally {
      if (showSpin) setIsRefreshing(false);
    }
  };

  // Polling contínuo a cada 4 segundos para novas solicitações aparecerem automaticamente
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStudents(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const openCreateModal = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewCrm('');
    setNewPlan('basic');
    setNewRole('student');
    setCreateError('');
    setIsCreateModalOpen(true);
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsCreating(true);

    try {
      const res = await createDoctorAction({
        name: newName,
        email: newEmail,
        password: newPassword,
        crm: newCrm,
        plan_type: newPlan,
        role: newRole,
      });

      if (!res.success) {
        throw new Error(res.error || 'Falha ao cadastrar médico.');
      }

      if (res.user) {
        setUsers((prev) => [res.user!, ...prev.filter((u) => u.email.toLowerCase() !== res.user!.email.toLowerCase())]);
      }
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err.message || 'Erro inesperado.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportCSV = () => {
    if (!users || users.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const headers = ['ID', 'Nome', 'Email', 'Cargo', 'Status', 'Plano', 'Data de Criação'];
    const rows = users.map((u) => [
      u.id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      u.email,
      u.role,
      u.approval_status,
      u.plan_type || 'basic',
      u.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `membros_flegon_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApprove = async (userId: string) => {
    const prevUsers = [...users];
    // Atualização otimista imediata (0ms)
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, approval_status: 'approved' as const } : u))
    );

    try {
      const res = await approveStudentAction(userId);
      if (!res.success) throw new Error(res.error);
    } catch (err: any) {
      setUsers(prevUsers);
      alert(`Erro ao aprovar solicitação: ${err.message}`);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Deseja realmente rejeitar esta solicitação? O acesso deste usuário permanecerá bloqueado.')) {
      return;
    }
    const prevUsers = [...users];
    // Atualização otimista imediata (0ms)
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, approval_status: 'rejected' as const } : u))
    );

    try {
      const res = await rejectStudentAction(userId);
      if (!res.success) throw new Error(res.error);
    } catch (err: any) {
      setUsers(prevUsers);
      alert(`Erro ao rejeitar: ${err.message}`);
    }
  };

  const openEditModal = (user: StudentRecord) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditStatus(user.approval_status || 'pending');
    setEditPlan(user.plan_type || 'basic');
    setEditPassword(user.password || '');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    const prevUsers = [...users];
    const targetUserId = editingUser.id;
    const updatedData: Partial<StudentRecord> = {
      name: editName,
      approval_status: editStatus,
      plan_type: editPlan,
      password: editPassword,
    };

    // Atualização otimista imediata
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? ({ ...u, ...updatedData } as StudentRecord) : u))
    );
    setEditingUser(null);

    try {
      const result = await updateStudentAction(targetUserId, {
        name: editName,
        approval_status: editStatus,
        plan_type: editPlan,
        password: editPassword,
      });

      if (!result.success) throw new Error(result.error);
    } catch (err: any) {
      setUsers(prevUsers);
      alert(`Erro ao salvar usuário: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const pendingUsers = users.filter((u) => u.approval_status === 'pending');
  const activeUsers = users.filter((u) => u.approval_status !== 'pending');

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#BFA783] mb-2">
            <Users className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Gestão de Comunidade</span>
          </div>
          <h2 className="text-4xl font-heading font-bold tracking-tight text-[#F5F3EF] uppercase">Membros e Acessos</h2>
          <p className="text-[#A6ACAF] text-sm mt-1">Moderação de ingressos e controle de permissões premium.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => refreshStudents(true)}
            variant="glass"
            size="sm"
            disabled={isRefreshing}
            className="text-[10px] tracking-widest font-bold flex items-center gap-1.5 text-[#A6ACAF] hover:text-[#F5F3EF]"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-[#BFA783]' : ''}`} />
            ATUALIZAR
          </Button>
          <Button onClick={handleExportCSV} variant="glass" size="sm" className="text-[10px] tracking-widest font-bold">
            EXPORTAR CSV
          </Button>
          <Button onClick={openCreateModal} variant="premium" size="sm" className="text-[10px] tracking-widest font-bold flex items-center">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            CONVIDAR MÉDICO
          </Button>
        </div>
      </div>

      {/* Solicitações Aguardando Auditoria (Pendente) */}
      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-[#BFA783] animate-pulse shadow-[0_0_8px_rgba(191,167,131,0.6)]" />
            <h3 className="text-xs font-bold text-[#BFA783] uppercase tracking-[0.25em]">
              Solicitações Aguardando Auditoria ({pendingUsers.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingUsers.map((user) => (
              <Card
                key={user.id}
                className="bg-[#172127]/90 border border-[#BFA783]/30 backdrop-blur-2xl overflow-hidden group hover:border-[#BFA783]/60 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.25)]"
              >
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[#BFA783]/10 flex items-center justify-center border border-[#BFA783]/25 group-hover:bg-[#BFA783]/20 transition-all">
                      <Users className="h-6 w-6 text-[#BFA783]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#F5F3EF] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#A6ACAF] truncate font-medium tracking-wide">{user.email}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#695C49]/20 flex items-center justify-between text-[10px] text-[#A6ACAF] font-bold uppercase tracking-widest">
                    <span>Solicitado em</span>
                    <span className="text-[#E9DDC9]">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => handleApprove(user.id)}
                      className="flex-1 h-9 bg-[#BFA783] hover:bg-[#a89270] text-[#0A1115] text-[10px] font-bold tracking-widest uppercase transition-all shadow-[0_2px_10px_rgba(191,167,131,0.2)]"
                    >
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleReject(user.id)}
                      variant="ghost"
                      className="h-9 px-3 text-[#A6ACAF] hover:text-red-400 hover:bg-red-500/10 text-[10px] font-bold tracking-widest uppercase"
                    >
                      Ignorar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Base Geral de Membros */}
      <Card className="bg-[#172127]/90 border border-[#695C49]/25 backdrop-blur-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#695C49]/20 bg-[#1D292F]/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F5F3EF] uppercase tracking-widest">Base Geral de Membros</h3>
            <p className="text-[11px] text-[#A6ACAF] mt-0.5">Alunos e administradores credenciados no ecossistema.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#BFA783]" />
              <span className="text-[9px] font-bold text-[#A6ACAF] uppercase tracking-wider">Admin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-[9px] font-bold text-[#A6ACAF] uppercase tracking-wider">Médico</span>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-[#0A1115]/50 border-b border-[#695C49]/20">
            <TableRow className="border-[#695C49]/20 hover:bg-transparent">
              <TableHead className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest py-4 px-6">
                Identificação
              </TableHead>
              <TableHead className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest py-4">
                Nível de Acesso
              </TableHead>
              <TableHead className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest py-4">
                Modalidade
              </TableHead>
              <TableHead className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest py-4">
                Status CRM
              </TableHead>
              <TableHead className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest py-4 text-right px-6">
                Gestão
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!activeUsers || activeUsers.length === 0 ? (
              <TableRow className="border-[#695C49]/20 hover:bg-transparent">
                <TableCell colSpan={5} className="h-40 text-center text-[#A6ACAF]">
                  <AlertCircle className="h-6 w-6 mx-auto mb-3 opacity-30 text-[#BFA783]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Nenhum registro validado encontrado
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              activeUsers.map((user) => (
                <TableRow key={user.id} className="border-[#695C49]/20 hover:bg-white/[0.02] transition-colors group">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#1D292F] flex items-center justify-center border border-[#695C49]/30 group-hover:border-[#BFA783]/40 transition-all">
                        <Users className="h-4 w-4 text-[#A6ACAF] group-hover:text-[#BFA783] transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#F5F3EF] group-hover:text-[#BFA783] transition-colors">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-[#A6ACAF] font-medium tracking-tight">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge variant="premium" className="h-5 px-2 text-[8px] tracking-[0.2em] bg-[#BFA783]/20 border-[#BFA783]/40 text-[#E9DDC9]">
                        ADMIN
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 px-2 text-[8px] tracking-[0.2em] border-blue-400/30 text-blue-300 bg-blue-500/10">
                        MÉDICO
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <span className="text-[10px] font-bold text-[#A6ACAF]/60 tracking-widest italic">SISTEMA</span>
                    ) : user.plan_type === 'premium' ? (
                      <Badge variant="premium" className="h-5 px-2 text-[8px] tracking-[0.2em]">
                        PREMIUM
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 px-2 text-[8px] tracking-[0.2em] border-[#695C49]/40 text-[#A6ACAF]">
                        ESSENTIAL
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.approval_status === 'approved' ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        <span className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest">Validado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        <span className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest">Restrito</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button
                      onClick={() => openEditModal(user)}
                      variant="glass"
                      size="sm"
                      className="h-8 px-3 text-[9px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Configurar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[480px] border border-[#695C49]/30 bg-[#0A1115]/95 backdrop-blur-3xl text-[#F5F3EF] shadow-[0_0_50px_rgba(0,0,0,0.6)] p-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#BFA783] to-transparent opacity-60" />

          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif font-bold uppercase tracking-tight text-[#F5F3EF]">
                Perfil do Membro
              </DialogTitle>
              <DialogDescription className="text-[#A6ACAF] text-xs font-medium uppercase tracking-[0.2em]">
                Controle de governança e permissões de acesso.
              </DialogDescription>
            </DialogHeader>

            {editingUser && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                    Identidade Nominal
                  </Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={isSaving}
                    className="bg-[#172127] border-[#695C49]/30 focus-visible:ring-[#BFA783]/40 text-sm h-11 font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                    Senha de Acesso
                  </Label>
                  <Input
                    id="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    disabled={isSaving}
                    placeholder="Alterar senha..."
                    className="bg-[#172127] border-[#695C49]/30 focus-visible:ring-[#BFA783]/40 text-sm h-11 font-mono text-[#BFA783]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                      Auditoria
                    </Label>
                    <select
                      id="status"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      disabled={isSaving || editingUser.role === 'admin'}
                      className="w-full h-11 rounded-lg border border-[#695C49]/30 bg-[#172127] px-3 text-xs font-bold uppercase tracking-widest text-[#F5F3EF] focus:outline-none focus:ring-2 focus:ring-[#BFA783]/40 disabled:opacity-40 transition-all"
                    >
                      <option value="pending" className="bg-[#0A1115]">Pendente</option>
                      <option value="approved" className="bg-[#0A1115]">Aprovado</option>
                      <option value="rejected" className="bg-[#0A1115]">Rejeitado</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                      Tier do Membro
                    </Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPlan('basic')}
                        disabled={isSaving || editingUser.role === 'admin'}
                        className={`flex-1 h-11 rounded-lg border transition-all text-[9px] font-bold tracking-widest uppercase ${
                          editPlan === 'basic'
                            ? 'bg-[#1D292F] border-[#695C49] text-[#F5F3EF]'
                            : 'bg-transparent border-[#695C49]/25 text-[#A6ACAF] hover:text-[#F5F3EF]'
                        }`}
                      >
                        Essential
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPlan('premium')}
                        disabled={isSaving || editingUser.role === 'admin'}
                        className={`flex-1 h-11 rounded-lg border transition-all text-[9px] font-bold tracking-widest uppercase ${
                          editPlan === 'premium'
                            ? 'bg-[#BFA783]/20 border-[#BFA783]/60 text-[#E9DDC9] shadow-[0_0_12px_rgba(191,167,131,0.2)]'
                            : 'bg-transparent border-[#695C49]/25 text-[#A6ACAF] hover:text-[#F5F3EF]'
                        }`}
                      >
                        Premium
                      </button>
                    </div>
                  </div>
                </div>

                {editingUser.role !== 'admin' && (
                  <div className="p-4 bg-[#172127]/60 border border-[#695C49]/25 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 flex-shrink-0 bg-[#BFA783]/10 rounded-lg flex items-center justify-center border border-[#BFA783]/25">
                        <GraduationCap className="h-4 w-4 text-[#BFA783]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#BFA783] uppercase tracking-[0.2em] mb-0.5">Acesso Estratégico</p>
                        <p className="text-[11px] text-[#A6ACAF] leading-relaxed">
                          Membros com tier <span className="text-[#F5F3EF] font-semibold">Premium</span> possuem liberação antecipada de todos os módulos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-2 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setEditingUser(null)}
                disabled={isSaving}
                className="h-11 text-[10px] font-bold text-[#A6ACAF] tracking-widest uppercase px-5"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isSaving}
                variant="premium"
                className="h-11 text-[10px] font-bold tracking-widest uppercase flex-1 shadow-lg"
              >
                {isSaving ? 'PROCESSANDO...' : 'SALVAR ALTERAÇÕES'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Convidar / Cadastrar Médico */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px] border border-[#695C49]/30 bg-[#0A1115]/95 backdrop-blur-3xl text-[#F5F3EF] shadow-[0_0_50px_rgba(0,0,0,0.6)] p-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#BFA783] to-transparent opacity-60" />

          <form onSubmit={handleCreateDoctor} className="p-8 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif font-bold uppercase tracking-tight text-[#F5F3EF]">
                Convidar Médico
              </DialogTitle>
              <DialogDescription className="text-[#A6ACAF] text-xs font-medium uppercase tracking-[0.2em]">
                Cadastrar novo profissional com aprovação e credenciais imediatas.
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg font-medium">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-name" className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                  Nome Completo *
                </Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  disabled={isCreating}
                  placeholder="Ex: Dr. Roberto Alencar"
                  className="bg-[#172127] border-[#695C49]/30 focus-visible:ring-[#BFA783]/40 text-sm h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email" className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                    E-mail de Acesso *
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    disabled={isCreating}
                    placeholder="medico@flegon.com"
                    className="bg-[#172127] border-[#695C49]/30 focus-visible:ring-[#BFA783]/40 text-sm h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-crm" className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                    CRM (Opcional)
                  </Label>
                  <Input
                    id="new-crm"
                    value={newCrm}
                    onChange={(e) => setNewCrm(e.target.value)}
                    disabled={isCreating}
                    placeholder="Ex: 12345/SP"
                    className="bg-[#172127] border-[#695C49]/30 focus-visible:ring-[#BFA783]/40 text-sm h-11 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                  Senha de Acesso *
                </Label>
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isCreating}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-[#172127] border-[#695C49]/30 focus-visible:ring-[#BFA783]/40 text-sm h-11 font-mono text-[#BFA783]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                    Nível de Acesso
                  </Label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    disabled={isCreating}
                    className="w-full h-11 rounded-lg border border-[#695C49]/30 bg-[#172127] px-3 text-xs font-bold uppercase tracking-widest text-[#F5F3EF] focus:outline-none focus:ring-2 focus:ring-[#BFA783]/40 transition-all"
                  >
                    <option value="student" className="bg-[#0A1115]">Médico</option>
                    <option value="admin" className="bg-[#0A1115]">Administrador</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-[#A6ACAF] uppercase tracking-widest px-1">
                    Tier / Modalidade
                  </Label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    disabled={isCreating}
                    className="w-full h-11 rounded-lg border border-[#695C49]/30 bg-[#172127] px-3 text-xs font-bold uppercase tracking-widest text-[#F5F3EF] focus:outline-none focus:ring-2 focus:ring-[#BFA783]/40 transition-all"
                  >
                    <option value="basic" className="bg-[#0A1115]">Essential</option>
                    <option value="premium" className="bg-[#0A1115]">Premium</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
                className="h-11 text-[10px] font-bold text-[#A6ACAF] tracking-widest uppercase px-5"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                variant="premium"
                className="h-11 text-[10px] font-bold tracking-widest uppercase flex-1 shadow-lg"
              >
                {isCreating ? 'CADASTRANDO...' : 'CONCLUIR CADASTRO'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
