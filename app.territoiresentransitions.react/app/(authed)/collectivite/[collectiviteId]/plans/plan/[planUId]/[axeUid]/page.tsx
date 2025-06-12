import { fetchCollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { createClient } from '@/api/utils/supabase/server-client';
import { fetchPlanAction } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/server-actions/fetch-plan-action';
import { renderLoader } from '@/app/utils/renderLoader';
import dynamic from 'next/dynamic';
import { z } from 'zod';

const PlanAction = dynamic(
  () =>
    import(
      '@/app/app/pages/collectivite/PlansActions/PlanAction/PlanAction'
    ).then((module) => ({
      default: module.PlanAction,
    })),
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
  const [collectivite, planNodes] = await Promise.all([
    fetchCollectiviteNiveauAcces(supabaseClient, data.collectiviteId),
    fetchPlanAction(supabaseClient, data.planUId),
  ]);
  if (!collectivite || !planNodes) {
    return <div>Collectivité ou plan non trouvé</div>;
  }

  const plan = planNodes.find((a) => a.depth === 0);
  const axe = planNodes.find((a) => a.id === data.axeUid);

  if (!plan || !axe) {
    return <div>Plan ou axe non trouvé</div>;
  }
  return (
    <PlanAction
      currentPlan={plan}
      axe={axe}
      axes={planNodes}
      currentCollectivite={collectivite}
    />
  );
}
