import { DemarcheVisitProvider } from '@/app/demarches/components/avance-panel-visit.context';
import { assertCanMutateDemarchePcaet } from '@/app/demarches/pcaet/assert-can-mutate';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { z } from 'zod';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string; demarcheId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId, demarcheId } = await params;
  const collectiviteId = z.coerce.number().safeParse(unsafeCollectiviteId);

  if (!collectiviteId.success) {
    notFound();
  }

  // Valide le param une fois pour toutes les pages du segment ; les
  // composants le lisent via useDemarchePcaetId().
  if (!z.coerce.number().int().positive().safeParse(demarcheId).success) {
    notFound();
  }

  await assertCanMutateDemarchePcaet(collectiviteId.data);

  // Le provider dure le temps de la visite de la démarche : il porte l'ouverture
  // du panneau d'avancée à l'arrivée, une seule fois. La `key` le remonte quand
  // on passe d'une démarche à une autre — le layout d'un segment dynamique,
  // lui, reste monté d'un `demarcheId` au suivant.
  return (
    <DemarcheVisitProvider key={demarcheId}>{children}</DemarcheVisitProvider>
  );
}
