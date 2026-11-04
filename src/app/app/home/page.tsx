import StudentHomeClient from '@/components/layout/student-home-client';
import { getHomeConfigAction } from '@/app/admin/experience/actions';
import { getModulesAction } from '@/app/admin/modules/actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentHome() {
  const [config, modules] = await Promise.all([
    getHomeConfigAction(),
    getModulesAction(),
  ]);

  const activeModules = (modules || []).filter((m: any) => m.status !== 'archived');

  return <StudentHomeClient config={config} modulesToUse={activeModules} />;
}
