'use client';

import { Session } from '@supabase/supabase-js';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AuthHeaders,
  getAuthHeaders,
} from '../../utils/supabase/get-auth-headers';
import { useSupabase } from '../../utils/supabase/use-supabase';

type UserContextProps = {
  user: UserWithRolesAndPermissions | null;
  setUser: (user: UserWithRolesAndPermissions | null) => void;

  session: Session | null;
  authHeaders: AuthHeaders;
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
  const [user, setUser] = useState<UserWithRolesAndPermissions | null>(null);

  const authHeaders = useMemo(() => getAuthHeaders(session), [session]);

  useEffect(() => {
    // Fetch initial session immediately on mount so we don't wait for the async callback race
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
      }
    });
  }, [supabase]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
      } else if (session) {
        setSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <UserContext value={{ user, setUser, session, authHeaders }}>
      {children}
    </UserContext>
  );
};
