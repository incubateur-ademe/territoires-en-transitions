import { IndicateurDetail } from '@/app/app/pages/collectivite/Indicateurs/detail/indicateur-detail.view';

export default async function Page({
  params,
}: {
  params: Promise<{
    referentielId: string;
    indicateurId: string;
  }>;
}) {
  const { referentielId, indicateurId } = await params;
  return (
    <IndicateurDetail
      dataTest={`ind-v-${referentielId}`}
      indicateurId={indicateurId}
    />
  );
}
