import { DemarchePcaetConsultationPage } from '@/app/demarches/pcaet/consultation/demarche-pcaet-consultation.page';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasPermission } from '@tet/domain/users';
import { notFound } from 'next/navigation';
import { z } from 'zod';

const idSchema = z.coerce.number().int().positive();

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string; demarcheId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId, demarcheId: unsafeDemarcheId } =
    await params;
  const collectiviteId = idSchema.safeParse(unsafeCollectiviteId);
  const demarcheId = idSchema.safeParse(unsafeDemarcheId);

  if (!collectiviteId.success || !demarcheId.success) {
    notFound();
  }

  const user = await getUser();
  if (
    !hasPermission(user, 'demarches.pcaet.read', {
      collectiviteId: collectiviteId.data,
    })
  ) {
    notFound();
  }

  return (
    <DemarchePcaetConsultationPage
      collectiviteId={collectiviteId.data}
      demarcheId={demarcheId.data}
    />
  );
}
