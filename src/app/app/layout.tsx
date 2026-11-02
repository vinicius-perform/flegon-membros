import { StudentHeader } from '@/components/layout/student-header';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#0A1115] text-[#F5F3EF] selection:bg-[#BFA783]/20 selection:text-[#BFA783]">
      <StudentHeader />
      <main className="w-full pb-20">
        {children}
      </main>
    </div>
  );
}
