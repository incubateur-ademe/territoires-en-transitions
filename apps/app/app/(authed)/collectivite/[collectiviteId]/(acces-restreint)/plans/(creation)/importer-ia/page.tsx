import { AiImportView } from '@/app/plans/plans/import-plan/ai-import.view';
import { notFound } from 'next/navigation';
import { z } from 'zod';

export default async function AiImportPlanPage({
  params,
}: {
  params: Promise<{ collectiviteId: string }>;
}) {
  const rawParams = await params;
  const collectiviteId = z.coerce.number().safeParse(rawParams.collectiviteId);

  if (!collectiviteId.success) {
    return notFound();
  }

  return <AiImportView />;
}
