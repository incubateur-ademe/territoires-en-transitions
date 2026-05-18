import { DemarchePcaetDiagnosticPage } from '@/app/demarches/pcaet/demarche-pcaet-diagnostic.page';

export default async function Page({
  params,
}: {
  params: Promise<{ demarchePcaetId: string }>;
}) {
  const { demarchePcaetId } = await params;
  return <DemarchePcaetDiagnosticPage demarcheId={demarchePcaetId} />;
}
