import { DemarchePcaetDetailPage } from '@/app/demarches/pcaet/demarche-pcaet-detail.page';

export default async function Page({
  params,
}: {
  params: Promise<{ demarchePcaetId: string }>;
}) {
  const { demarchePcaetId } = await params;
  return <DemarchePcaetDetailPage demarcheId={demarchePcaetId} />;
}
