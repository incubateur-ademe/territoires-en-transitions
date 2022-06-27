import {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {User, UserCredentials} from '@supabase/supabase-js';
import {supabaseClient} from '../supabase';

// typage du contexte exposé par le fournisseur
export type TAuthContext = {
  connect: (data: UserCredentials) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  user: User | null;
  authError: string | null;
  isConnected: boolean;
};

// crée le contexte
const AuthContext = createContext<TAuthContext | null>(null);

// le hook donnant accès au context
export const useAuth = () => useContext(AuthContext) as TAuthContext;

// le fournisseur de contexte
export const AuthProvider = ({children}: {children: ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // initialisation : enregistre l'écouteur de changements d'état
  useEffect(() => {
    // restaure une éventuelle session précédente
    const session = supabaseClient.auth.session();
    setUser(session?.user ?? null);

    // écoute les changements d'état (connecté, déconnecté, etc.)
    const {data: listener} = supabaseClient.auth.onAuthStateChange(
      async (event, updatedSession) => {
        setUser(updatedSession?.user ?? null);
        if (updatedSession?.user) {
          setAuthError(null);
          setCrispUserData(updatedSession.user);
        } else {
          clearCrispUserData();
        }
      }
    );

    return () => {
      listener?.unsubscribe();
    };
  }, []);

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
  const value = {connect, disconnect, user, authError, isConnected};

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// affecte les données de l'utilisateur connecté à la chatbox
const setCrispUserData = (user: User) => {
  if ('$crisp' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const {$crisp} = window as any;

    // lecture des dcp
    const {id: userId, email} = user;
    supabaseClient
      .from('dcp')
      .select('user_id,nom,prenom')
      .eq('user_id', userId)
      .then(({data}) => {
        if (data?.length) {
          const {nom, prenom} = data[0];
          // enregistre le nom/prénom
          $crisp.push(['set', 'user:nickname', [`${prenom} ${nom}`]]);
        }
      });

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
