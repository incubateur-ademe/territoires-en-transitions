import { IndicateurDetail } from '@/app/app/pages/collectivite/Indicateurs/detail/IndicateurDetail';

export default function Page({
  params,
}: {
  params: {
    referentielId: string;
    identifiant: string;
  };
}) {
  const { referentielId, identifiant } = params;
  return (
    <IndicateurDetail
      dataTest={`ind-v-${referentielId}`}
      indicateurId={identifiant}
    />
  );
}
