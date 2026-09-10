import { DossiersInstructionPage } from '@/app/demarches/pcaet/instruction/dossiers-instruction.page';
import z from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  return <DossiersInstructionPage serviceId={collectiviteId} />;
}
