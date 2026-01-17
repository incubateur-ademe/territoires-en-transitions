import { UnverifiedUserCard } from '@/app/users/unverified-user-card';
import { CollectiviteProviderStore } from '@tet/api/collectivites/index.server';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { ReactNode } from 'react';
import z from 'zod';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  const user = await getUser();

  const userIsNotInCollectivite = !user.collectivites.some(
    (collectivite) => collectivite.collectiviteId === Number(collectiviteId)
  );

  // User can be unverified and belong to a collectivite if they are the first member of this collectivite.
  // In this case, they can see their collectivite informations.
  // Here, we want to make sure that an unverified user cannot see other collectivites informations.
  const userNotAllowedToVisitCollectivite =
    !hasRole(user, PlatformRole.VERIFIED) && userIsNotInCollectivite;

  return (
    <CollectiviteProviderStore collectiviteId={collectiviteId}>
      {userNotAllowedToVisitCollectivite ? <UnverifiedUserCard /> : children}
    </CollectiviteProviderStore>
  );
}
