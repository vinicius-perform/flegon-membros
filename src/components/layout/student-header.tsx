'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Bell, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearSessionAction } from '@/app/actions';
import { FlegonLogo } from '@/components/ui/flegon-logo';
import { ProfileDialog } from '@/components/layout/profile-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export function StudentHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. Membro');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar nome do usuário logado se disponível
  useEffect(() => {
    async function loadUserName() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single();

          if (profile?.name) {
            setDoctorName(profile.name);
          }
        }
      } catch {
        // mantém fallback Dr. Membro
      }
    }
    loadUserName();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await clearSessionAction();
    window.location.href = '/';
  };

  const handleOpenProfile = () => {
    setDropdownOpen(false);
    setProfileOpen(true);
  };

  return (
    <>
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

            {/* Container do Menu do Usuário */}
            <div className="relative pl-4 border-l border-[#695C49]/25" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-[#172127]/60 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#BFA783]/50 group"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Menu do Usuário"
              >
                <div className="flex flex-col items-end hidden sm:flex text-right mr-1">
                  <span className="text-xs font-serif font-medium text-[#F5F3EF] group-hover:text-[#BFA783] transition-colors max-w-[150px] truncate">
                    {doctorName}
                  </span>
                  <span className="text-[9px] text-[#BFA783] uppercase tracking-[0.22em] font-sans font-semibold">
                    Membro Exclusivo
                  </span>
                </div>

                <div className="h-9 w-9 rounded-full border border-[#695C49]/40 bg-[#172127] group-hover:border-[#BFA783]/80 group-hover:shadow-[0_0_12px_rgba(191,167,131,0.25)] flex items-center justify-center transition-all">
                  <User className="h-4 w-4 text-[#E9DDC9] group-hover:text-[#BFA783] transition-colors" />
                </div>

                <ChevronDown className={`h-3 w-3 text-[#A6ACAF] transition-transform duration-200 hidden sm:block ${dropdownOpen ? 'rotate-180 text-[#BFA783]' : ''}`} />
              </button>

              {/* Menu Dropdown Suspenso */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[#172127] border border-[#695C49]/40 shadow-[0_12px_40px_rgba(0,0,0,0.6)] py-1.5 z-50 overflow-hidden"
                  >
                    <div className="px-3.5 py-2 border-b border-[#695C49]/20 sm:hidden">
                      <p className="text-xs font-serif font-medium text-[#F5F3EF] truncate">{doctorName}</p>
                      <p className="text-[9px] text-[#BFA783] uppercase tracking-wider">Membro Exclusivo</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-[#F5F3EF] hover:bg-[#1D292F] hover:text-[#BFA783] transition-colors text-left font-medium"
                    >
                      <div className="h-7 w-7 rounded-md bg-[#1D292F] border border-[#695C49]/30 flex items-center justify-center text-[#BFA783]">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span>Perfil</span>
                        <span className="text-[9px] text-[#A6ACAF] font-normal">Informações cadastrais</span>
                      </div>
                    </button>

                    <div className="my-1 border-t border-[#695C49]/20" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-2 text-xs text-[#A6ACAF] hover:bg-[#8B2E2E]/15 hover:text-[#F5F3EF] transition-colors text-left font-medium group"
                    >
                      <div className="h-7 w-7 rounded-md bg-[#1D292F] border border-[#695C49]/30 flex items-center justify-center text-[#A6ACAF] group-hover:text-[#8B2E2E]">
                        <LogOut className="h-3.5 w-3.5" />
                      </div>
                      <span>Sair</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Perfil */}
      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onProfileUpdated={(newName) => setDoctorName(newName)}
      />
    </>
  );
}
