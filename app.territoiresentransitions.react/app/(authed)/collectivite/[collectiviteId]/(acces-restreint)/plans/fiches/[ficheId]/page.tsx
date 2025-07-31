import { fetchCurrentCollectivite } from '@/api/collectivites';
import { createClient } from '@/api/utils/supabase/server-client';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@/api/utils/trpc/server-client';
import { FicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheAction';
import z from 'zod';

const paramsSchema = z.object({
  collectiviteId: z.coerce.number(),
  ficheId: z.coerce.number(),
});

export default async function FicheDetailPage({
  params,
}: {
  params: Promise<{
    collectiviteId: string;
    ficheId: string;
  }>;
}) {
  const rawParams = await params;
  const { collectiviteId, ficheId } = paramsSchema.parse(rawParams);

  const supabaseClient = await createClient();
  const [collectivite, fiche] = await Promise.all([
    fetchCurrentCollectivite(supabaseClient, collectiviteId),
    getQueryClient().fetchQuery(
      trpcInServerComponent.plans.fiches.get.queryOptions({
        id: ficheId,
      })
    ),
  ]);

  if (!collectivite || !fiche) {
    return <div>Collectivité ou fiche non trouvée</div>;
  }
  return <FicheAction collectivite={collectivite} fiche={fiche} />;
}
