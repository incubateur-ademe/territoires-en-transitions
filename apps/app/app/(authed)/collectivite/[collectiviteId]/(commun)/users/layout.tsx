import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasPermission } from '@tet/domain/users';
import { ReactNode } from 'react';
import { z } from 'zod';
import { UsersHeader } from './users-header';

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

  const canInvite = hasPermission(user, 'collectivites.membres.mutate', {
    collectiviteId,
  });

  return (
    <>
      <UsersHeader canInvite={canInvite} />
      {children}
    </>
  );
}
