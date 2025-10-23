import 'server-only';

import { ReactNode } from 'react';
import { getUser } from '../user-details.fetch.server';
import { UserProviderStoreClient } from './user-context-store.client';

export const UserProviderStore = async ({
  children,
}: {
  children: ReactNode;
}) => {
  const user = await getUser();

  return (
    <UserProviderStoreClient user={user}>{children}</UserProviderStoreClient>
  );
};
