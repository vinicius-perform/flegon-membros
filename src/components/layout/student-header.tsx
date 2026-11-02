'use client';

import Link from 'next/link';
import { User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearSessionAction } from '@/app/actions';
import { FlegonLogo } from '@/components/ui/flegon-logo';

export function StudentHeader() {
  const handleLogout = async () => {
    await clearSessionAction();
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300 border-b border-[#695C49]/25 bg-[#0A1115]/85 backdrop-blur-xl">
      <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-[#BFA783]/30 to-transparent" />
      
      <div className="relative z-10 flex items-center justify-between px-6 md:px-12 h-20 max-w-[1920px] mx-auto">
        <Link href="/app/home" className="flex items-center transition-opacity hover:opacity-90">
          <FlegonLogo size="md" subtitle="BODY SCULPT MENTORIA" />
        </Link>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#A6ACAF] hover:text-[#BFA783] hover:bg-[#172127] transition-colors relative"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#BFA783] rounded-full ring-2 ring-[#0A1115]" />
          </Button>
          
          <div className="flex items-center gap-3.5 pl-4 border-l border-[#695C49]/25">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-serif font-medium text-[#F5F3EF]">Dr. Membro</span>
              <span className="text-[9px] text-[#BFA783] uppercase tracking-[0.22em] font-sans font-semibold">
                Membro Exclusivo
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full border border-[#695C49]/40 bg-[#172127] hover:border-[#BFA783]/60 transition-all p-0 h-9 w-9"
              onClick={handleLogout}
              title="Encerrar Sessão"
            >
              <User className="h-4 w-4 text-[#E9DDC9]" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
