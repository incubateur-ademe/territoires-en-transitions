import { DossierInstructionPage } from '@/app/demarches/pcaet/instruction/dossier/dossier-instruction.page';
import z from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string; demandeAvisId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId, demandeAvisId: unsafeDemande } =
    await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);
  const demandeAvisId = z.coerce.number().parse(unsafeDemande);

  return (
    <DossierInstructionPage
      collectiviteInstruiteId={collectiviteId}
      demandeAvisId={demandeAvisId}
    />
  );
}
