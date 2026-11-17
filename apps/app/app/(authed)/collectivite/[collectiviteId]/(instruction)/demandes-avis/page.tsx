import { DossiersInstructionPage } from '@/app/demarches/pcaet/instruction/dossiers-instruction.page';
import { getCollectivite } from '@tet/api/collectivites/index.server';
import z from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);
  const collectivite = await getCollectivite(collectiviteId);

  return (
    <DossiersInstructionPage
      serviceId={collectiviteId}
      serviceType={collectivite.collectiviteType}
    />
  );
}
