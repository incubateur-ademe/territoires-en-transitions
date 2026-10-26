import { makeCollectiviteDemarchePcaetDiagnosticUrl } from '@/app/app/paths';
import { redirect } from 'next/navigation';

/**
 * La racine d'une démarche n'a pas de contenu propre : chaque étape a son URL,
 * et la première est le diagnostic et les objectifs.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string; demarcheId: string }>;
}) {
  const { collectiviteId, demarcheId } = await params;

  redirect(
    makeCollectiviteDemarchePcaetDiagnosticUrl({
      collectiviteId: Number(collectiviteId),
      demarcheId: Number(demarcheId),
    })
  );
}
