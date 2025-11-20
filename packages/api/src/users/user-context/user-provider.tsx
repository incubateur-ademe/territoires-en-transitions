'use client';

import { Session } from '@supabase/supabase-js';
import { UserWithCollectiviteAccesses } from '@tet/domain/users';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSupabase } from '../../utils/supabase/use-supabase';

type UserContextProps = {
  user: UserWithCollectiviteAccesses | null;
  setUser: (user: UserWithCollectiviteAccesses | null) => void;

  session: Session | null;
};

const UserContext = createContext<UserContextProps | null>(null);

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext doit être utilisé dans un UserProvider');
  }

  return context;
}

export function useUser() {
  const { user } = useUserContext();
  if (!user) {
    throw new Error('user has not been authenticated yet');
  }
  return user;
}

export function useUserSession(): Session | null {
  const context = useContext(UserContext);
  if (!context) {
    return null;
  }

  return context.session;
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const supabase = useSupabase();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserWithCollectiviteAccesses | null>(null);

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
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED'
      ) {
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <UserContext.Provider value={{ user, setUser, session }}>
      {children}
    </UserContext.Provider>
  );
};
