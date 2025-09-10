import { fetchCurrentCollectivite } from '@/api/collectivites';
import { createClient } from '@/api/utils/supabase/server-client';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@/api/utils/trpc/server-client';
import { FicheActionWrapper } from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheActionWrapper';
import z from 'zod';

const paramsSchema = z.object({
  collectiviteId: z.coerce.number(),
  planId: z.coerce.number(),
  ficheId: z.coerce.number(),
});

export default async function FicheDetailPage({
  params,
}: {
  params: Promise<{
    collectiviteId: string;
    planId: string;
    ficheId: string;
  }>;
}) {
  const rawParams = await params;
  const { collectiviteId, ficheId, planId } = paramsSchema.parse(rawParams);

  const supabaseClient = await createClient();
  const [collectivite, fiche, plan] = await Promise.all([
    fetchCurrentCollectivite(supabaseClient, collectiviteId),
    getQueryClient().fetchQuery(
      trpcInServerComponent.plans.fiches.get.queryOptions({
        id: ficheId,
      })
    ),
    getQueryClient().fetchQuery(
      trpcInServerComponent.plans.plans.get.queryOptions({
        planId,
      })
    ),
  ]);

  if (!collectivite || !fiche) {
    return <div>Collectivité ou fiche non trouvée</div>;
  }
  return (
    <FicheActionWrapper collectivite={collectivite} fiche={fiche} plan={plan} />
  );
}
