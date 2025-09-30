import {
  getQueryClient,
  trpcInServerComponent,
} from '@/api/utils/trpc/server-client';
import { Plan } from '@/app/plans/plans/show-plan';
import { z } from 'zod';

const parametersSchema = z.object({
  planId: z.coerce.number(),
});

export default async function PlanPage({
  params,
}: {
  params: Promise<{ planId: number }>;
}) {
  const { success, data } = parametersSchema.safeParse(await params);
  if (!success) {
    return <div>URL non valide</div>;
  }

  const plan = await getQueryClient().fetchQuery(
    trpcInServerComponent.plans.plans.get.queryOptions({
      planId: data.planId,
    })
  );

  if (!plan) {
    return <div>Plan non trouvé</div>;
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
