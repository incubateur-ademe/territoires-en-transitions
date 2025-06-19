import { fetchCollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { createClient } from '@/api/utils/supabase/server-client';
import { PlanAction } from '@/app/app/pages/collectivite/PlansActions/PlanAction';
import { fetchPlanType } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/fetch-plan-type';
import { fetchPlanAction } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/server-actions/fetch-plan-action';
import { z } from 'zod';

const parametersSchema = z.object({
  planUId: z.coerce.number(),
  collectiviteId: z.coerce.number(),
});

export default async function Page({
  params,
}: {
  params: Promise<{ planUId: number; collectiviteId: number }>;
}) {
  const { success, data } = parametersSchema.safeParse(await params);
  if (!success) {
    return <div>URL non valide</div>;
  }

  const supabaseClient = await createClient();

  const [collectivite, planNodes, planType] = await Promise.all([
    fetchCollectiviteNiveauAcces(supabaseClient, data.collectiviteId),
    fetchPlanAction(supabaseClient, data.planUId),
    fetchPlanType(supabaseClient, {
      collectiviteId: data.collectiviteId,
      planId: data.planUId,
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
      planId={data.planUId}
    />
  );
}
