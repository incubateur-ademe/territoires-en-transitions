import { ReferentsPcaetPage } from '@/app/demarches/pcaet/referents/referents-pcaet.page';
import z from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  return <ReferentsPcaetPage collectiviteId={collectiviteId} />;
}
