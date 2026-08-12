import { appLabels } from '@/app/labels/catalog';
import { Plan } from '@/app/plans/plans/show-plan';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@tet/api/utils/trpc/trpc-server-client';
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
    return <div>{appLabels.urlNonValide}</div>;
  }

  const plan = await getQueryClient().fetchQuery(
    trpcInServerComponent.plans.plans.get.queryOptions({
      planId: data.planId,
      collectiviteId: data.collectiviteId,
    })
  );

  if (!plan) {
    return <div>{appLabels.planNonTrouve}</div>;
  }

  return (
    <Plan
      plan={{
        ...plan,
        nom: plan.nom ?? 'Sans titre',
      }}
    />
  );
}
