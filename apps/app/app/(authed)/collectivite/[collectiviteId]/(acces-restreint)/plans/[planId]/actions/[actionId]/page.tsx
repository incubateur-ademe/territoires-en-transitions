import { FicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheAction';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@tet/api/utils/trpc/server-client';
import z from 'zod';

const paramsSchema = z.object({
  planId: z.coerce.number(),
  actionId: z.coerce.number(),
});

export default async function FicheDetailPage({
  params,
}: {
  params: Promise<{
    planId: string;
    actionId: string;
  }>;
}) {
  const rawParams = await params;
  const { actionId, planId } = paramsSchema.parse(rawParams);

  const fiche = await getQueryClient().fetchQuery(
    trpcInServerComponent.plans.fiches.get.queryOptions({
      id: actionId,
    })
  );

  if (!fiche) {
    return <div>Action non trouvée</div>;
  }
  return <FicheAction fiche={fiche} planId={planId} />;
}
