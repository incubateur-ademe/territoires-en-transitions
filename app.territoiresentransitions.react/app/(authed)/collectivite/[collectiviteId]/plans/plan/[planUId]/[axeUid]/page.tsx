import { fetchCollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { createClient } from '@/api/utils/supabase/server-client';
import { fetchPlanType } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/fetch-plan-type';
import { fetchPlanAction } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/server-actions/fetch-plan-action';
import { renderLoader } from '@/app/utils/renderLoader';
import dynamic from 'next/dynamic';
import { z } from 'zod';

const PlanAction = dynamic(
  () =>
    import('@/app/app/pages/collectivite/PlansActions/PlanAction').then(
      (module) => ({
        default: module.PlanAction,
      })
    ),
  {
    loading: () => renderLoader(),
  }
);

const parametersSchema = z.object({
  planUId: z.coerce.number(),
  axeUid: z.coerce.number(),
  collectiviteId: z.coerce.number(),
});

export default async function Page({
  params,
}: {
  params: Promise<{
    planUId: number;
    axeUid: number;
    collectiviteId: number;
  }>;
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
  if (!collectivite || !planNodes) {
    return <div>Collectivité ou plan non trouvé</div>;
  }

  const axe = planNodes.find((a) => a.id === data.axeUid);

  if (!axe) {
    return <div>Axe non trouvé</div>;
  }
  return (
    <PlanAction
      planId={data.planUId}
      axeId={data.axeUid}
      rootAxe={axe}
      axes={planNodes}
      currentCollectivite={collectivite}
      planType={planType}
    />
  );
}
