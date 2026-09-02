import { DemandesAvisPage } from '@/app/demarches/pcaet/instruction/demandes-avis.page';
import z from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  return <DemandesAvisPage serviceId={collectiviteId} />;
}
