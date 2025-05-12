import { createServerClient } from '@/api/utils/trpc/server-client';
import { makeCollectiviteIndicateursListUrl } from '@/app/app/paths';
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

  const trpc = await createServerClient();
  const count = await trpc.indicateurs.definitions.getMesIndicateursCount.query(
    {
      collectiviteId,
    }
  );

  redirect(
    makeCollectiviteIndicateursListUrl({
      collectiviteId,
      listId: count ? 'mes-indicateurs' : 'cles',
    })
  );
}
