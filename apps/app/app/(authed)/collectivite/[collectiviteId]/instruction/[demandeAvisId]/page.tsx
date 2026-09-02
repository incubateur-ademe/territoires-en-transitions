import { DossierInstructionPage } from '@/app/demarches/pcaet/instruction/dossier/dossier-instruction.page';
import z from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ demandeAvisId: string }>;
}) {
  const { demandeAvisId: unsafeDemandeAvisId } = await params;
  const demandeAvisId = z.coerce.number().parse(unsafeDemandeAvisId);

  return <DossierInstructionPage demandeAvisId={demandeAvisId} />;
}
