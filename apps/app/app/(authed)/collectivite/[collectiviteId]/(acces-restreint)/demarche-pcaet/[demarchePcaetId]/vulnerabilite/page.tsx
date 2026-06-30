import { VulnerabiliteTerritoirePage } from '@/app/demarches/pcaet/vulnerabilite-territoire.page';

export default async function Page({
  params,
}: {
  params: Promise<{ demarchePcaetId: string }>;
}) {
  const { demarchePcaetId } = await params;
  return <VulnerabiliteTerritoirePage demarcheId={demarchePcaetId} />;
}
