import { DemarchePcaetDocumentsPage } from '@/app/demarches/pcaet/demarche-pcaet-documents.page';

export default async function Page({
  params,
}: {
  params: Promise<{ demarchePcaetId: string }>;
}) {
  const { demarchePcaetId } = await params;
  return <DemarchePcaetDocumentsPage demarcheId={demarchePcaetId} />;
}
