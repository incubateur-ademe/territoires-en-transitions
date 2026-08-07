import { ErreurAccesPage } from '@/app/demarches/pcaet/erreur-acces/erreur-acces.page';
import { UnverifiedUserCard } from '@/app/users/unverified-user-card';
import {
  CollectiviteProviderStore,
  getCollectivite,
} from '@tet/api/collectivites/index.server';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
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

  const collectivite = await getCollectivite(collectiviteId);

  return (
    <CollectiviteProviderStore collectiviteId={collectiviteId}>
      {userNotAllowedToVisitCollectivite ? (
        <UnverifiedUserCard />
      ) : isServiceDeconcentre(collectivite.collectiviteType) ? (
        <ErreurAccesPage dashboardHref="/" />
      ) : (
        children
      )}
    </CollectiviteProviderStore>
  );
}
