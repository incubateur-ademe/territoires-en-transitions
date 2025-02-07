'use client';

import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { usePostHog } from 'posthog-js/react';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { UserDetails } from './fetch-user-details.server';

// typage du contexte exposé par le fournisseur
export type UserContextProps = {
  user: UserDetails;
};

const UserContext = createContext<UserContextProps | null>(null);

// le hook donnant accès au context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser doit être utilisé dans un UserProvider');
  }

  return context.user;
};

// le fournisseur de contexte
export const UserProvider = ({
  user,
  children,
}: {
  user: UserDetails;
  children: ReactNode;
}) => {
  const posthog = usePostHog();

  useEffect(() => {
    // écoute les changements d'état (connecté, déconnecté, etc.)
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('onAuthStateChange', event, session?.user);

      if (event === 'INITIAL_SESSION') {
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          user_id: session?.user.id,
        });
      } else if (event === 'SIGNED_OUT') {
        clearCrispUserData();
        posthog.reset();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [posthog]);

  // Initialise les widgets externes.
  // useEffect(() => {
  //   if (userData) {
  //     setCrispUserData(userData);

  //     let environment = process.env.NODE_ENV;
  //     if (window.location.href.includes('upcoming')) environment = 'test';
  //     if (window.location.href.includes('localhost'))
  //       environment = 'development';

  //     if (environment === 'production' || environment === 'test') {
  //       // @ts-expect-error - StonlyWidget is not defined
  //       window.StonlyWidget('identify', userData.user_id);
  //     }
  //   }
  // }, [userData]);

  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
};

declare global {
  interface Window {
    $crisp: {
      push: (args: [action: string, method: string, value?: string[]]) => void;
    };
  }
}

// affecte les données de l'utilisateur connecté à la chatbox
const setCrispUserData = (userData: UserDetails | null) => {
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
