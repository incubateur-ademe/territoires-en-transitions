'use client';

import { ReactNode, useEffect } from 'react';
import { UserDetails } from '../user-details.fetch.server';
import { useUserContext } from './user-provider';

export const UserProviderStoreClient = ({
  children,
  user: newUser,
}: {
  children: ReactNode;
  user: UserDetails;
}) => {
  const { user, setUser } = useUserContext();

  useEffect(() => {
    if (newUser.id !== user?.id) {
      setUser(newUser);
    }
  }, [newUser, user, setUser]);

  return children;
};
