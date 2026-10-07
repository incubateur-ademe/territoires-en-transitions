import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { redirect } from 'next/navigation';

/**
 * La racine d'une fiche action n'a pas de contenu propre : chaque onglet a son URL,
 * et le premier est le détail de la fiche.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string; actionId: string }>;
}) {
  const { collectiviteId, actionId } = await params;

  redirect(
    makeCollectiviteActionUrl({
      collectiviteId: Number(collectiviteId),
      ficheUid: actionId,
    })
  );
}
