import { fetchCurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { createClient } from '@/api/utils/supabase/server-client';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@/api/utils/trpc/server-client';
import { Plan } from '@/app/plans/plans/show-plan';
import { z } from 'zod';

const parametersSchema = z.object({
  planId: z.coerce.number(),
  collectiviteId: z.coerce.number(),
});

export default async function PlanPage({
  params,
}: {
  params: Promise<{ planId: number; collectiviteId: number }>;
}) {
  const { success, data } = parametersSchema.safeParse(await params);
  if (!success) {
    return <div>URL non valide</div>;
  }

  const supabaseClient = await createClient();

  const [collectivite, plan] = await Promise.all([
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
  if (!plan) {
    return <div>Plan non trouvé</div>;
  }

  return (
    <Plan
      plan={{
        ...plan,
        nom: plan.nom ?? 'Sans titre',
      }}
      currentCollectivite={collectivite}
    />
  );
}
