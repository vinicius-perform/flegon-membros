import { getModulesAction } from './actions';
import { ModulesList } from '@/components/modules/modules-list';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminModulesPage() {
  const modules = await getModulesAction();
  return <ModulesList modules={modules || []} />;
}
