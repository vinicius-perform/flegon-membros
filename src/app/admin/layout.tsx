import { AdminSidebar } from '@/components/layout/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A1115] text-[#F5F3EF]">
      <AdminSidebar />
      <main className="flex-1 h-screen overflow-y-auto w-full relative custom-scrollbar">
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[350px] bg-[#BFA783]/8 blur-[160px] rounded-full pointer-events-none" />
        <div className="p-8 relative z-10 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
