import { fetchCurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { createClient } from '@/api/utils/supabase/server-client';
import { fetchPlanType } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/use-get-plan-type/fetch-plan-type';
import { DetailedPlan } from '@/app/plans/plans/show-detailed-plan';
import { fetchPlan } from '@/app/plans/plans/show-detailed-plan/data/fetch-plan';
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
    fetchPlan(supabaseClient, data.planId),
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
    <DetailedPlan
      planId={data.planId}
      rootAxe={plan}
      axes={planNodes}
      currentCollectivite={collectivite}
      planType={planType}
    />
  );
}
