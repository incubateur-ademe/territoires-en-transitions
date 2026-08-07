import { assertCanMutateDemarchePcaet } from '@/app/demarches/pcaet/assert-can-mutate';
import { CreateDemarchePcaetPage } from '@/app/demarches/pcaet/create.page';
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

  return <CreateDemarchePcaetPage />;
}
