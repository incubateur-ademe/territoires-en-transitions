import { useState } from 'react';
import { UserDetails } from '../user-details.fetch.server';
import { useUserContext } from './user-provider';

export function useSubscribeToUserAuthEvents({
  onSignIn: onSignedIn,
  onSignOut: onSignedOut,
}: {
  onSignIn?: (user: UserDetails) => void;
  onSignOut?: () => void;
}) {
  const { user: authedUser } = useUserContext();

  const [user, setUser] = useState<UserDetails | null>(null);

  if (authedUser && user !== authedUser) {
    setUser(authedUser);
    onSignedIn?.(authedUser);
  }

  if (!authedUser && user) {
    setUser(null);
    onSignedOut?.();
  }
}
