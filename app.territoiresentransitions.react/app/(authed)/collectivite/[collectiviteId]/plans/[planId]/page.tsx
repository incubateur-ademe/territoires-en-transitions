import { fetchCurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { createClient } from '@/api/utils/supabase/server-client';
import { fetchPlanType } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/fetch-plan-type';
import { PlanAction } from '@/app/plans/plans/show-detailed-plan-action';
import { fetchPlanAction } from '@/app/plans/plans/show-detailed-plan-action/data/fetch-plan-action';
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

  const [collectivite, planNodes, planType] = await Promise.all([
    fetchCurrentCollectivite(supabaseClient, data.collectiviteId),
    fetchPlanAction(supabaseClient, data.planId),
    fetchPlanType(supabaseClient, {
      collectiviteId: data.collectiviteId,
      planId: data.planId,
    }),
  ]);

  if (!collectivite) {
    return <div>Collectivité non trouvée</div>;
  }

  if (!planNodes) {
    return <div>Plan non trouvé</div>;
  }

  const plan = planNodes.find((a) => a.depth === 0);

  if (!plan) {
    return <div>Plan non trouvé</div>;
  }
  return (
    <PlanAction
      rootAxe={plan}
      axes={planNodes}
      currentCollectivite={collectivite}
      planType={planType}
      planId={data.planId}
    />
  );
}
