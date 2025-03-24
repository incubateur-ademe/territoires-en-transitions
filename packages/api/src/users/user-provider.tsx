'use client';

import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { Session } from '@supabase/supabase-js';
import { usePostHog } from 'posthog-js/react';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { UserDetails } from './user-details.fetch.server';

type UserContextProps = {
  user: UserDetails | null;
  session: Session | null;
};

const UserContext = createContext<UserContextProps | null>(null);

function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser doit être utilisé dans un UserProvider');
  }

  return context;
}

export function useUser() {
  const { user } = useUserContext();
  return user as UserDetails;
}

export function useUserSession() {
  const { session } = useUserContext();
  return session;
}

// le fournisseur de contexte
export const UserProvider = ({
  user,
  onInitialSession,
  onSignedOut,
  children,
}: {
  user: UserDetails | null;
  onInitialSession?: (user: UserDetails, session: Session) => void;
  onSignedOut?: () => void;
  children: ReactNode;
}) => {
  const posthog = usePostHog();
  const supabase = useSupabase();

  const [session, setSession] = useState<Session | null>(null);

  // écoute les changements d'état (connecté, déconnecté, etc.)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('onAuthStateChange', event, session?.user);

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        setSession(session);
        onInitialSession?.(user as UserDetails, session as Session);
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        onSignedOut?.();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onInitialSession, onSignedOut, posthog, supabase.auth, user]);

  return (
    <UserContext.Provider value={{ user, session }}>
      {children}
    </UserContext.Provider>
  );
};
