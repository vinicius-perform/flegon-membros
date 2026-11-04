import { getModuleWithLessonsAction } from '@/app/admin/modules/actions';
import { getSessionAction } from '@/app/actions';
import LessonClient from './LessonClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }> | { id: string; lessonId: string };
}) {
  const resolvedParams = await params;
  const modId = resolvedParams?.id || 'mod-1';
  const lessId = resolvedParams?.lessonId || 'first';

  const [{ module, lessons }, sessionRole] = await Promise.all([
    getModuleWithLessonsAction(modId),
    getSessionAction(),
  ]);

  return (
    <LessonClient
      modId={modId}
      lessId={lessId}
      initialModule={module}
      initialLessons={lessons}
      initialRole={sessionRole || 'student'}
    />
  );
}
