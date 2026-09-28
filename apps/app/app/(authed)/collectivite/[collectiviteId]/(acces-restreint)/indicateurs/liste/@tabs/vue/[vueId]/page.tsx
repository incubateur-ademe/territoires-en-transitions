import { IndicateurVueView } from '@/app/indicateurs/vues/indicateur-vue.view';

export default async function Page({
  params,
}: {
  params: Promise<{ vueId: string }>;
}) {
  const { vueId } = await params;
  return <IndicateurVueView vueId={vueId} />;
}
