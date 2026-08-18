import { HistoriqueListe } from '@/app/referentiels/Historique/HistoriqueListe';
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

  return <HistoriqueListe referentielId={parsed.data} />;
}
