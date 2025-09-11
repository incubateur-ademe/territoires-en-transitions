import { CollectiviteProvider } from '@/api/collectivites';
import { getUser } from '@/api/users/user-details.fetch.server';
import { UnverifiedUserCard } from '@/app/users/unverified-user-card';
import { ReactNode } from 'react';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: number }>;
}) {
  const { collectiviteId } = await params;

  const user = await getUser();

  const userIsNotInCollectivite =
    user.collectivites.length === 0 ||
    !user.collectivites.some(
      (collectivite) => collectivite.collectivite_id === Number(collectiviteId)
    );

  // User can be unverified and belong to a collectivite if they are the first member of this collectivite.
  // In this case, they can see their collectivite informations.
  // Here, we want to make sure that an unverified user cannot see other collectivites informations.
  if (!user.isVerified && userIsNotInCollectivite) {
    return <UnverifiedUserCard />;
  }

  return (
    <CollectiviteProvider collectiviteId={collectiviteId}>
      {children}
    </CollectiviteProvider>
  );
}
