import { makeCollectiviteDemarchePcaetDocumentsUrl } from '@/app/app/paths';
import { redirect } from 'next/navigation';

/**
 * La racine d'une démarche n'a pas de contenu propre : chaque étape a son URL,
 * et la première est le dépôt des documents attendus.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string; demarcheId: string }>;
}) {
  const { collectiviteId, demarcheId } = await params;

  redirect(
    makeCollectiviteDemarchePcaetDocumentsUrl({
      collectiviteId: Number(collectiviteId),
      demarcheId: Number(demarcheId),
    })
  );
}
