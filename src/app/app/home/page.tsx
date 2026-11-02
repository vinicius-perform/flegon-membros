import { supabase } from '@/lib/supabase';
import StudentHomeClient from '@/components/layout/student-home-client';
import { getHomeConfigAction } from '@/app/admin/experience/actions';

export const revalidate = 60;

export default async function StudentHome() {
  const [config, modulesResult] = await Promise.all([
    getHomeConfigAction(),
    supabase.from('modules').select('*').order('order', { ascending: true })
  ]);
  
  const modulesToUse = modulesResult.data || [];

  return <StudentHomeClient config={config} modulesToUse={modulesToUse} />;
}
