import { DemarchePcaetPlanActionsPage } from '@/app/demarches/pcaet/demarche-pcaet-plan-actions.page';

export default async function Page({
  params,
}: {
  params: Promise<{ demarchePcaetId: string }>;
}) {
  const { demarchePcaetId } = await params;
  return <DemarchePcaetPlanActionsPage demarcheId={demarchePcaetId} />;
}
