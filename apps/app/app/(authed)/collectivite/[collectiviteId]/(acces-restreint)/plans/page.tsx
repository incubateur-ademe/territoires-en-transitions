import { AllPlansView } from '@/app/plans/plans/list-all-plans/all-plans.view';
import { appLabels } from '@/app/labels/catalog';
import { z } from 'zod';

export default async function PlansListPage({
  params,
}: {
  params: Promise<{
    collectiviteId: string;
  }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const { success } = z.coerce.number().safeParse(unsafeCollectiviteId);

  if (!success) {
    return <div>{appLabels.collectiviteIdInvalide}</div>;
  }

  return <AllPlansView />;
}
