import { DossierInstructionPage } from '@/app/demarches/pcaet/instruction/dossier/dossier-instruction.page';
import z from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string; demarcheId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId, demarcheId: unsafeDemarche } =
    await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);
  const demarcheId = z.coerce.number().parse(unsafeDemarche);

  return (
    <DossierInstructionPage
      collectiviteInstruiteId={collectiviteId}
      dossierRef={{ demarcheId }}
    />
  );
}
