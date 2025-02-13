import { IndicateurDetail } from '@/app/app/pages/collectivite/Indicateurs/detail/IndicateurDetail';

export default function Page({
  params,
}: {
  params: {
    indicateurId: string;
  };
}) {
  const { indicateurId } = params;
  const id = parseInt(indicateurId);

  return (
    <IndicateurDetail
      dataTest={`ind-${id}`}
      indicateurId={id}
      isPerso
    />
  );
}
