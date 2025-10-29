import { UserWithCollectiviteAccesses } from '@/domain/users';
import { useState } from 'react';
import { useUserContext } from './user-provider';

export function useSubscribeToUserAuthEvents({
  onSignIn: onSignedIn,
  onSignOut: onSignedOut,
}: {
  onSignIn?: (user: UserWithCollectiviteAccesses) => void;
  onSignOut?: () => void;
}) {
  const { user: authedUser } = useUserContext();

  const [user, setUser] = useState<UserWithCollectiviteAccesses | null>(null);

  if (authedUser && user !== authedUser) {
    setUser(authedUser);
    onSignedIn?.(authedUser);
  }

  if (!authedUser && user) {
    setUser(null);
    onSignedOut?.();
  }
}
