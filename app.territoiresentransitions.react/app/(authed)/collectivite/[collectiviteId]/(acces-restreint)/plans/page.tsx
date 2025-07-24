import { createClient } from '@/api/utils/supabase/server-client';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@/api/utils/trpc/server-client';
import { fetchCollectivitePanierInfo } from '@/app/collectivites/panier/data/fetchCollectivitePanierInfo';
import { AllPlansView } from '@/app/plans/plans/list-all-plans/all-plans.view';
import { z } from 'zod';

export default async function PlansListPage({
  params,
}: {
  params: Promise<{
    collectiviteId: string;
  }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const { success, data: collectiviteId } = z.coerce
    .number()
    .safeParse(unsafeCollectiviteId);

  if (!success) {
    return <div>Invalid collectiviteId</div>;
  }

  const supabaseClient = await createClient();
  const [panier, plans] = await Promise.all([
    fetchCollectivitePanierInfo(supabaseClient, collectiviteId),
    getQueryClient().fetchQuery(
      trpcInServerComponent.plans.plans.list.queryOptions({
        collectiviteId,
      })
    ),
  ]);

  return (
    <AllPlansView
      plans={plans.plans}
      collectiviteId={collectiviteId}
      panierId={panier?.panierId}
    />
  );
}
