import { SignInWithPasswordCredentials, User } from '@supabase/supabase-js';
import {
  clearAuthTokens,
  getRootDomain,
  restoreSessionFromAuthTokens,
  setAuthTokens,
} from '@tet/api';
import { Enums } from '@tet/api/database.types';
import { dcpFetch } from '@tet/api/utilisateurs/shared/data_access/dcp.fetch';
import { signUpPath } from 'app/paths';
import { ENV } from 'environmentVariables';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
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

type Membre = {
  fonction?: Enums<'membre_fonction'> | null;
  est_referent?: boolean | null;
};

export type UserData = User & DCP & Membre & { isSupport: boolean | undefined };
export type DCP = {
  nom?: string;
  prenom?: string;
  cgu_acceptees_le?: string | null;
};

// crée le contexte
export const AuthContext = createContext<TAuthContext | null>(null);

// le hook donnant accès au context
export const useAuth = () => useContext(AuthContext) as TAuthContext;

// le fournisseur de contexte
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // récupère la session courante
  const currentSession = useCurrentSession();
  const [session, setSession] = useState(currentSession);
  const user = session?.user;

  // pour stocker la dernière erreur d'authentification
  const [authError, setAuthError] = useState<string | null>(null);

  // charge les données associées à l'utilisateur courant
  const { data: dcp, isSuccess: dcpLoaded } = useDCP(user?.id);
  const { data: isSupport } = useIsSupport(user?.id);
  const { data: membre } = useMembre(user?.id);
  const userData = useMemo(
    () => (user && dcp ? { ...user, ...dcp, ...membre, isSupport } : null),
    [user, dcp, membre]
  );

  // initialisation : enregistre l'écouteur de changements d'état
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
        // @ts-ignore
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

  // les données exposées par le fournisseur de contexte
  const isConnected = Boolean(user);
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
    authError,
    isConnected,
    authHeaders,
  };

  // Redirige l'utilisateur vers la page de saisie des DCP si nécessaire
  const userInfoRequired = session && dcpLoaded && !dcp;
  if (userInfoRequired) {
    document.location.replace(`${signUpPath}&view=etape3`);
  }

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

// hook qui utilise les queries DCP
export const useDCP = (user_id?: string) => {
  return useQuery(['dcp', user_id], () =>
    user_id ? dcpFetch({ dbClient: supabaseClient, user_id }) : null
  );
};

// vérifie si l'utilisateur courant à le droit "support"
const useIsSupport = (user_id?: string) =>
  useQuery(['is_support', user_id], async () => {
    if (!user_id) return false;
    const { data } = await supabaseClient.rpc('est_support');
    return data || false;
  });

const useMembre = (userId?: string) =>
  useQuery(['user_membre', userId], async () => {
    if (!userId) {
      return false;
    }
    const { data } = await supabaseClient
      .from('private_collectivite_membre')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data;
  });

const useCurrentSession = () => {
  const { data, error } = useQuery(['session'], async () => {
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
  });

  if (error || !data) {
    return null;
  }

  return data;
};
