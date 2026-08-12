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
  const { collectiviteId: unsafeCollectiviteId, demarcheId } =
    await params;
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

  return children;
}
