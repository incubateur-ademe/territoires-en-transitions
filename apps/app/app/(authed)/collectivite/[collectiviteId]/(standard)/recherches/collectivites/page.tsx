import { CollectivitesView } from '@/app/app/pages/CollectivitesEngagees/Views/collectivites/CollectivitesView';
import { UnverifiedUserCard } from '@/app/users/unverified-user-card';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { notFound } from 'next/navigation';
import z from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: number }>;
}) {
  const user = await getUser();

  if (!hasRole(user, PlatformRole.VERIFIED)) {
    return <UnverifiedUserCard />;
  }

  const { collectiviteId: rawCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().safeParse(rawCollectiviteId);
  if (!collectiviteId.success) {
    return notFound();
  }
  return <CollectivitesView collectiviteId={collectiviteId.data} />;
}
