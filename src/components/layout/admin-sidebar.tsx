'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  FolderOpen,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { clearSessionAction } from '@/app/actions';
import { FlegonLogo } from '@/components/ui/flegon-logo';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Experiência do Aluno', href: '/admin/experience', icon: Sparkles },
  { name: 'Módulos e Aulas', href: '/admin/modules', icon: FolderOpen },
  { name: 'Alunos & Médicos', href: '/admin/students', icon: Users },
  { name: 'Matrículas', href: '/admin/enrollments', icon: GraduationCap },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await clearSessionAction();
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col w-64 h-screen border-r border-[#695C49]/25 bg-[#0A1115] relative z-50 select-none">
      <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-[#BFA783]/20 to-transparent pointer-events-none" />
      
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-[#695C49]/20">
        <Link href="/admin/dashboard" className="transition-opacity hover:opacity-90">
          <FlegonLogo size="sm" subtitle="ADMIN CONSOLE" />
        </Link>
      </div>
      
      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1 custom-scrollbar">
        <div className="px-3 mb-3">
           <span className="text-[9px] font-semibold text-[#A6ACAF]/70 uppercase tracking-[0.25em]">Gestão & Controle</span>
        </div>
        
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive 
                    ? 'text-[#0A1115] font-semibold' 
                    : 'text-[#A6ACAF] hover:text-[#F5F3EF] hover:bg-[#172127]/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-sidebar-active"
                    className="absolute inset-0 bg-[#BFA783] rounded-lg shadow-[0_2px_12px_rgba(191,167,131,0.25)]"
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <item.icon className={`h-4 w-4 relative z-10 transition-colors ${isActive ? 'text-[#0A1115]' : 'group-hover:text-[#BFA783]'}`} />
                <span className={`text-xs uppercase tracking-wider relative z-10 ${isActive ? 'text-[#0A1115]' : ''}`}>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-4 mt-auto border-t border-[#695C49]/20">
        <div className="bg-[#172127]/80 border border-[#695C49]/25 rounded-xl p-3.5 mb-3">
           <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#BFA783] animate-pulse" />
              <span className="text-[8px] font-semibold text-[#E9DDC9] uppercase tracking-widest">Flegon Members</span>
           </div>
           <p className="text-[10px] text-[#A6ACAF] leading-tight">Dr. Flegon David • v2.4</p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-lg bg-[#172127]/60 border border-[#695C49]/30 text-[#A6ACAF] hover:bg-[#8B2E2E]/20 hover:text-[#F5F3EF] hover:border-[#8B2E2E]/40 transition-all font-semibold text-[10px] tracking-widest uppercase"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
