import { assertCanMutateDemarchePcaet } from '@/app/demarches/pcaet/assert-can-mutate';
import { ListDemarchesPcaetPage } from '@/app/demarches/pcaet/list-demarches/list-demarches-pcaet.page';
import { notFound } from 'next/navigation';
import { z } from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().safeParse(unsafeCollectiviteId);

  if (!collectiviteId.success) {
    notFound();
  }

  await assertCanMutateDemarchePcaet(collectiviteId.data);

  return <ListDemarchesPcaetPage />;
}
