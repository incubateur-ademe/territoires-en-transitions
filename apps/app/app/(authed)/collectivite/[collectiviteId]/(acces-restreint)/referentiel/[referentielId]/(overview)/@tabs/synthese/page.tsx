import { SyntheseReferentielView } from '@/app/referentiels/synthese/synthese-referentiel.view';
import { ReferentielId } from '@tet/domain/referentiels';

export default async function Page({
  params,
}: {
  params: Promise<{
    referentielId: ReferentielId;
  }>;
}) {
  const { referentielId } = await params;
  return <SyntheseReferentielView referentielId={referentielId} />;
}
