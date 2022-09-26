import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {User, UserCredentials} from '@supabase/supabase-js';
import {supabaseClient} from '../supabase';
import {useQuery} from 'react-query';

// typage du contexte exposé par le fournisseur
export type TAuthContext = {
  connect: (data: UserCredentials) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  user: UserData | null;
  authError: string | null;
  isConnected: boolean;
};
export type UserData = User & DCP;
type DCP = {nom?: string; prenom?: string};

// crée le contexte
export const AuthContext = createContext<TAuthContext | null>(null);

// le hook donnant accès au context
export const useAuth = () => useContext(AuthContext) as TAuthContext;

// le fournisseur de contexte
export const AuthProvider = ({children}: {children: ReactNode}) => {
  // restaure une éventuelle session précédente
  const session = supabaseClient.auth.session();
  const [user, setUser] = useState<User | null>(session?.user ?? null);

  // pour stocker la dernière erreur d'authentification
  const [authError, setAuthError] = useState<string | null>(null);

  // charge les données associées à l'utilisateur courant
  const dcp = useDCP(user?.id);
  const userData = useMemo(
    () => (user && dcp ? {...user, ...dcp} : null),
    [user, dcp]
  );

  // initialisation : enregistre l'écouteur de changements d'état
  useEffect(() => {
    // écoute les changements d'état (connecté, déconnecté, etc.)
    const {data: listener} = supabaseClient.auth.onAuthStateChange(
      async (event, updatedSession) => {
        setUser(updatedSession?.user ?? null);
        if (updatedSession?.user) {
          setAuthError(null);
        }
      }
    );

    return () => {
      listener?.unsubscribe();
    };
  }, []);

  // Initialise les données crisp.
  useEffect(() => {
    if (userData) {
      setCrispUserData(userData);
    } else {
      clearCrispUserData();
    }
  }, [userData]);

  // pour authentifier l'utilisateur
  const connect = (data: UserCredentials) =>
    supabaseClient.auth
      .signIn(data)
      .then(session => {
        if (!session.user) {
          setAuthError("L'email et le mot de passe ne correspondent pas.");
          return false;
        }
        return true;
      })
      .catch(() => {
        return false;
      });

  // pour déconnecter l'utilisateur
  const disconnect = () =>
    supabaseClient.auth.signOut().then(response => {
      if (response.error) {
        setAuthError(response.error.message);
        return false;
      }
      return true;
    });

  // les données exposées par le fournisseur de contexte
  const isConnected = Boolean(user);
  const value = {connect, disconnect, user: userData, authError, isConnected};

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// affecte les données de l'utilisateur connecté à la chatbox
const setCrispUserData = (userData: UserData | null) => {
  if ('$crisp' in window && userData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const {$crisp} = window as any;
    const {nom, prenom, email} = userData;

    if (nom && prenom) {
      $crisp.push(['set', 'user:nickname', [`${prenom} ${nom}`]]);
    }

    // enregistre l'email
    $crisp.push(['set', 'user:email', [email]]);
  }
};

// ré-initialise les données de la chatbox (appelée à la déconnexion)
const clearCrispUserData = () => {
  if ('$crisp' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const {$crisp} = window as any;
    $crisp.push(['set', 'user:nickname', [null]]);
    $crisp.push(['set', 'user:email', [null]]);
  }
};

// lecture des dcp
const fetchDCP = async (user_id: string) => {
  const {data} = await supabaseClient
    .from('dcp')
    .select('user_id,nom,prenom')
    .match({user_id});

  return data?.length ? data[0] : null;
};
const useDCP = (user_id?: string) => {
  const {data} = useQuery(['dcp', user_id], () =>
    user_id ? fetchDCP(user_id) : null
  );
  return data;
};
