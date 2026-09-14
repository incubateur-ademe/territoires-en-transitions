'use client';

import { Session, User } from '@supabase/supabase-js';
import { useSupabase } from '@tet/api';
import { createContext, useContext, useEffect, useState } from 'react';
import { match } from 'ts-pattern';

type AuthState =
  | { status: 'pending' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User };

const PENDING_AUTH_STATE: AuthState = { status: 'pending' };
const ANONYMOUS_AUTH_STATE: AuthState = { status: 'anonymous' };

const AuthStateContext = createContext<AuthState | null>(null);

const useAuthState = (): AuthState => {
  const authState = useContext(AuthStateContext);
  if (!authState) {
    throw new Error('useAuthState must be used within UserProvider');
  }
  return authState;
};

const hasAuthenticatedUser = (authState: AuthState): boolean =>
  match(authState)
    .with({ status: 'authenticated' }, () => true)
    .with({ status: 'pending' }, { status: 'anonymous' }, () => false)
    .exhaustive();

export const useIsAuthenticated = (): boolean =>
  hasAuthenticatedUser(useAuthState());

const toAuthState = (supabaseSession: Session | null): AuthState => {
  if (!supabaseSession) {
    return ANONYMOUS_AUTH_STATE;
  }
  return { status: 'authenticated', user: supabaseSession.user };
};

/**
 * Provider pour le contexte du user
 */
export const UserProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode => {
  const [authState, setAuthState] = useState<AuthState>(PENDING_AUTH_STATE);
  const supabase = useSupabase();

  useEffect(() => {
    // écoute les changements d'état (connecté, déconnecté, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      setAuthState(toAuthState(supabaseSession));
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  return <AuthStateContext value={authState}>{children}</AuthStateContext>;
};
