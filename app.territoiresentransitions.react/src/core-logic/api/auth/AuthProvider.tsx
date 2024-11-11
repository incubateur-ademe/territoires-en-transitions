import {
  Session,
  SignInWithPasswordCredentials,
  User,
} from '@supabase/supabase-js';
import {
  clearAuthTokens,
  getRootDomain,
  MaCollectivite,
  restoreSessionFromAuthTokens,
  setAuthTokens,
} from '@tet/api';
import { Tables } from '@tet/api/database.types';
import { dcpFetch } from '@tet/api/utilisateurs/shared/data_access/dcp.fetch';
import { fetchOwnedCollectivites } from 'core-logic/hooks/useOwnedCollectivites';
import { ENV } from 'environmentVariables';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useQuery } from 'react-query';
import { supabaseClient } from '../supabase';

// typage du contexte exposé par le fournisseur
export type TAuthContext = {
  connect: (data: SignInWithPasswordCredentials) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  user: UserData | null;
  authError: string | null;
  authHeaders: { authorization: string; apikey: string } | null;
  isConnected: boolean;
};

export type DCP = {
  nom?: string;
  prenom?: string;
  cgu_acceptees_le?: string | null;
};

export interface UserData extends User, DCP {
  dcp?: DCP;
  isSupport?: boolean;
  collectivites?: Array<
    MaCollectivite & { membre?: Tables<'private_collectivite_membre'> }
  >;
}

function useUserData(session: Session | null) {
  const { user } = session ?? {};

  return useQuery(['user_data', user?.id], async () => {
    if (!user?.id) {
      return null;
    }

    const [
      dcp,
      { data: isSupport },
      collectivites,
      { data: collectiviteMembres },
    ] = await Promise.all([
      dcpFetch({ dbClient: supabaseClient, user_id: user.id }),
      supabaseClient.rpc('est_support'),
      fetchOwnedCollectivites(),
      supabaseClient
        .from('private_collectivite_membre')
        .select('*')
        .eq('user_id', user.id),
    ]);

    if (!dcp) {
      return {
        ...user,
      };
    }

    return {
      ...user,
      ...dcp,
      dcp,
      isSupport: isSupport ?? false,
      collectivites: collectivites.map((c) => ({
        ...c,
        membre: collectiviteMembres?.find(
          (m) => m.collectivite_id === c.collectivite_id
        ),
      })),
    };
  });
}

// crée le contexte
export const AuthContext = createContext<TAuthContext | null>(null);

// le hook donnant accès au context
export const useAuth = () => useContext(AuthContext) as TAuthContext;

// le fournisseur de contexte
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // récupère la session courante
  const currentSession = useCurrentSession();
  const [session, setSession] = useState(currentSession);

  // pour stocker la dernière erreur d'authentification
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: userData = null } = useUserData(session);

  useEffect(() => {
    // écoute les changements d'état (connecté, déconnecté, etc.)
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, updatedSession) => {
      setSession(updatedSession);
      if (updatedSession?.user) {
        setAuthError(null);
      }
      if (event === 'SIGNED_OUT' && document.location.pathname !== '/') {
        // redirige sur la home si l'utilisateur a été déconnecté
        document.location.href = '/';
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Initialise les widgets externes.
  useEffect(() => {
    if (userData) {
      setCrispUserData(userData);

      let environment = process.env.NODE_ENV;
      if (window.location.href.includes('upcoming')) environment = 'test';
      if (window.location.href.includes('localhost'))
        environment = 'development';

      if (environment === 'production' || environment === 'test') {
        // @ts-expect-error - StonlyWidget is not defined
        window.StonlyWidget('identify', userData.user_id);
      }
    } else {
      clearCrispUserData();
    }
  }, [userData]);

  // pour authentifier l'utilisateur (utilisé uniquement depuis les tests e2e)
  const connect = async (data: SignInWithPasswordCredentials) =>
    supabaseClient.auth
      .signInWithPassword(data)
      .then(({ data }) => {
        if (!data.user) {
          setAuthError("L'email et le mot de passe ne correspondent pas.");
          return false;
        }
        setAuthTokens(data.session, getRootDomain(document.location.hostname));
        return true;
      })
      .catch(() => {
        return false;
      });

  // pour déconnecter l'utilisateur
  const disconnect = () =>
    supabaseClient.auth.signOut().then((response) => {
      if (response.error) {
        setAuthError(response.error.message);
        return false;
      }
      clearAuthTokens(getRootDomain(document.location.hostname));
      return true;
    });

  const authHeaders = session?.access_token
    ? {
        authorization: `Bearer ${session.access_token}`,
        apikey: `${ENV.supabase_anon_key}`,
      }
    : null;

  const value = {
    connect,
    disconnect,
    user: userData,
    isConnected: userData !== null,
    authError,
    authHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

declare global {
  interface Window {
    $crisp: {
      push: (args: [action: string, method: string, value?: string[]]) => void;
    };
  }
}

// affecte les données de l'utilisateur connecté à la chatbox
const setCrispUserData = (userData: UserData | null) => {
  if ('$crisp' in window && userData) {
    const { $crisp } = window;
    const { nom, prenom, email } = userData;

    if (nom && prenom) {
      $crisp.push(['set', 'user:nickname', [`${prenom} ${nom}`]]);
    }

    // enregistre l'email
    if (email) {
      $crisp.push(['set', 'user:email', [email]]);
    }
  }
};

// ré-initialise les données de la chatbox (appelée à la déconnexion)
const clearCrispUserData = () => {
  if ('$crisp' in window) {
    const { $crisp } = window;
    $crisp.push(['do', 'session:reset']);
  }
};

export async function getSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (data?.session) {
    return data.session;
  }
  if (error) throw error;

  // restaure une éventuelle session précédente
  const ret = await restoreSessionFromAuthTokens(supabaseClient);
  if (ret) {
    const { data, error } = ret;
    if (data?.session) {
      return data.session;
    }
    if (error) throw error;
  }
}

const useCurrentSession = () => {
  const { data, error } = useQuery(['session'], async () => {
    return getSession();
  });

  if (error || !data) {
    return null;
  }

  return data;
};

export async function getAuthHeaders() {
  const session = await getSession();
  return session?.access_token
    ? {
        authorization: `Bearer ${session.access_token}`,
        apikey: `${ENV.supabase_anon_key}`,
      }
    : null;
}
