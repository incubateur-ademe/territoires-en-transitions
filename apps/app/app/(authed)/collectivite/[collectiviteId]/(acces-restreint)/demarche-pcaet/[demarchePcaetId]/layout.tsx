import { assertCanMutateDemarchePcaet } from '@/app/demarches/pcaet/assert-can-mutate-demarche-pcaet';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { z } from 'zod';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().safeParse(unsafeCollectiviteId);

  if (!collectiviteId.success) {
    notFound();
  }

  await assertCanMutateDemarchePcaet(collectiviteId.data);

  return children;
}
