import { makeCollectiviteIndicateursListUrl } from '@/app/app/paths';
import { redirect } from 'next/navigation';

/** Redirige vers l'onglet par défaut "Tous les indicateurs" */
export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: number }>;
}) {
  const { collectiviteId } = await params;

  redirect(
    makeCollectiviteIndicateursListUrl({
      collectiviteId,
      listId: 'tous',
    })
  );
}
