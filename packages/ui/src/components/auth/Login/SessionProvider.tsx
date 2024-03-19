import {ReactNode, createContext, useEffect, useState} from 'react';
import {Session, SupabaseClient} from '@supabase/supabase-js';
import {clearAuthTokens, setAuthTokens} from '@tet/api';

const SessionContext = createContext<Session | null>(null);

type SessionProviderProps = {
  children: ReactNode;
  /** Nom du domaine principal auquel les cookies de session sont rattachés */
  domain: string;
  /** Client sur lequel écouter les événements d'authentification */
  supabase: SupabaseClient;
};

/**
 * Ecoute les événements d'authentification et fourni les informations de session.
 */
export const SessionProvider = ({
  children,
  domain,
  supabase,
}: SessionProviderProps) => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  // enregistre l'écouteur d'événements
  useEffect(() => {
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((event, session) => {
      // efface la session et les cookies à la déconnexion
      if (event === 'SIGNED_OUT') {
        setCurrentSession(null);
        clearAuthTokens(domain);
      }
      // enregistre la session et les cookies lors de la connexion
      else if (
        session &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
      ) {
        setCurrentSession(session);
        setAuthTokens(session, domain);
      }
    });

    // supprime l'écouteur qd le compo est démonté
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, domain]);

  // expose la session
  return (
    <SessionContext.Provider value={currentSession}>
      {children}
    </SessionContext.Provider>
  );
};
