import { IndicateurDetail } from '@/app/app/pages/collectivite/Indicateurs/detail/IndicateurDetail';

export default async function Page({
  params,
}: {
  params: Promise<{
    indicateurId: string;
  }>;
}) {
  const { indicateurId } = await params;
  const id = parseInt(indicateurId);

  return <IndicateurDetail dataTest={`ind-${id}`} indicateurId={id} isPerso />;
}
