import { getStudentsAction } from './actions';
import { StudentsClient } from '@/components/admin/students-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminStudentsPage() {
  const users = await getStudentsAction();
  return <StudentsClient initialUsers={users || []} />;
}
