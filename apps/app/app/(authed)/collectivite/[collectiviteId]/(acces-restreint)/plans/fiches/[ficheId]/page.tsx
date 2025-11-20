import { FicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheAction';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@tet/api/utils/trpc/server-client';
import z from 'zod';

const paramsSchema = z.object({
  ficheId: z.coerce.number(),
});

export default async function FicheDetailPage({
  params,
}: {
  params: Promise<{
    ficheId: string;
  }>;
}) {
  const rawParams = await params;
  const { ficheId } = paramsSchema.parse(rawParams);

  const fiche = await getQueryClient().fetchQuery(
    trpcInServerComponent.plans.fiches.get.queryOptions({
      id: ficheId,
    })
  );

  if (!fiche) {
    return <div>Fiche non trouvée</div>;
  }
  return <FicheAction fiche={fiche} />;
}
