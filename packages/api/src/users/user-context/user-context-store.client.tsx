'use client';

import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { ReactNode, useEffect } from 'react';
import { useUserContext } from './user-provider';

export const UserProviderStoreClient = ({
  children,
  user: newUser,
}: {
  children: ReactNode;
  user: UserWithRolesAndPermissions;
}) => {
  const { user, setUser } = useUserContext();

  useEffect(() => {
    setUser(newUser);
  }, [newUser, user, setUser]);

  return children;
};
