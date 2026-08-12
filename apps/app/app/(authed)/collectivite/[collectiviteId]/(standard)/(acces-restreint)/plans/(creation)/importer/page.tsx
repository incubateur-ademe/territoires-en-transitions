import { RequestPlanImportView } from '@/app/plans/plans/import-plan/request-plan-import-view';
import { notFound } from 'next/navigation';
import { z } from 'zod';

export default async function RequestPlanImportPage({
  params,
}: {
  params: Promise<{ collectiviteId: string }>;
}) {
  const rawParams = await params;
  const collectiviteId = z.coerce.number().safeParse(rawParams.collectiviteId);

  if (!collectiviteId.success) {
    return notFound();
  }

  return <RequestPlanImportView />;
}
