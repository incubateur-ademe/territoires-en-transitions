import { fetchCurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { createClient } from '@/api/utils/supabase/server-client';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@/api/utils/trpc/server-client';
import { DetailedPlan } from '@/app/plans/plans/show-detailed-plan';
import { z } from 'zod';

const parametersSchema = z.object({
  planId: z.coerce.number(),
  collectiviteId: z.coerce.number(),
});

export default async function Page({
  params,
}: {
  params: Promise<{ planId: number; collectiviteId: number }>;
}) {
  const { success, data } = parametersSchema.safeParse(await params);
  if (!success) {
    return <div>URL non valide</div>;
  }

  const supabaseClient = await createClient();

  const [collectivite, detailedPlan] = await Promise.all([
    fetchCurrentCollectivite(supabaseClient, data.collectiviteId),
    getQueryClient().fetchQuery(
      trpcInServerComponent.plans.plans.get.queryOptions({
        planId: data.planId,
      })
    ),
  ]);

  if (!collectivite) {
    return <div>Collectivité non trouvée</div>;
  }
  if (!detailedPlan) {
    return <div>Plan non trouvé</div>;
  }

  return (
    <DetailedPlan
      plan={{
        ...detailedPlan,
        nom: detailedPlan.nom ?? 'Sans titre',
      }}
      currentCollectivite={collectivite}
    />
  );
}
