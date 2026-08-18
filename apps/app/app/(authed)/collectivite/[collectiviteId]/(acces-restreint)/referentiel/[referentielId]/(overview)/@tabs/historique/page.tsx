import { HistoriqueReferentielView } from '@/app/referentiels/Historique/historique-referentiel.view';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ referentielId: string }>;
}) {
  const { referentielId: unsafeReferentielId } = await params;
  const parsed = referentielIdEnumSchema.safeParse(unsafeReferentielId);
  if (!parsed.success) {
    notFound();
  }

  return <HistoriqueReferentielView referentielId={parsed.data} />;
}
