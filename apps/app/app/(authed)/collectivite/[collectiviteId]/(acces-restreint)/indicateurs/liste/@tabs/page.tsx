import { makeCollectiviteIndicateursListUrl } from '@/app/app/paths';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@tet/api/utils/trpc/server-client';
import { redirect } from 'next/navigation';

/**
 * Redirige vers l'onglet par défaut ("mes indicateurs" si non vide ou
 * "indicateurs clés")
 */
export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: number }>;
}) {
  const { collectiviteId } = await params;

  const count = await getQueryClient().fetchQuery(
    trpcInServerComponent.indicateurs.indicateurs.getMesIndicateursCount.queryOptions(
      {
        collectiviteId,
      }
    )
  );

  redirect(
    makeCollectiviteIndicateursListUrl({
      collectiviteId,
      listId: count ? 'mes-indicateurs' : 'cles',
    })
  );
}
