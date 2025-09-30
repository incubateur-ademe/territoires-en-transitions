'use client';

import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { datadogLogs } from '@datadog/browser-logs';
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

export function useUserSession(): Session | null {
  const context = useContext(UserContext);
  if (!context) {
    return null;
  }

  return context.session;
}

// le fournisseur de contexte
export const UserProvider = ({
  user,
  onSignedOut,
  children,
}: {
  user: UserDetails;
  onSignedOut?: () => void;
  children: ReactNode;
}) => {
  const posthog = usePostHog();
  const supabase = useSupabase();

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Fetch initial session immediately on mount so we don't wait for the async callback race
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        setSession(currentSession);
      }
    });
  }, [supabase.auth]);

  useEffect(() => {
    // écoute les changements d'état (connecté, déconnecté, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      datadogLogs.logger.info(`onAuthStateChange: ${event}`, session?.user);

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED'
      ) {
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        onSignedOut?.();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onSignedOut, posthog, supabase.auth, user]);

  return (
    <UserContext.Provider value={{ user, session }}>
      {children}
    </UserContext.Provider>
  );
};
