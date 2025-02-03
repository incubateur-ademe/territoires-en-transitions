import { MaCollectivite } from '@/api';
import { Tables } from '@/api/database.types';
import { dcpFetch } from '@/api/utilisateurs/shared/data_access/dcp.fetch';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { fetchOwnedCollectivites } from '@/app/core-logic/hooks/useOwnedCollectivites';
import { User } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useQuery } from 'react-query';

// typage du contexte exposé par le fournisseur
export type TAuthContext = {
  user: UserData | null;
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

function useUserData(user: User) {
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
export const AuthProvider = ({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const { data: userData = null } = useUserData(user);

  const posthog = usePostHog();

  useEffect(() => {
    // écoute les changements d'état (connecté, déconnecté, etc.)
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event) => {
      console.log('onAuthStateChange', event);
      if (event === 'SIGNED_OUT' && pathname !== '/') {
        // redirige sur la home si l'utilisateur a été déconnecté
        // router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Initialise les widgets externes.
  useEffect(() => {
    if (userData) {
      setCrispUserData(userData);

      let environment = process.env.NODE_ENV;
      if (window.location.href.includes('upcoming')) environment = 'test';
      if (window.location.href.includes('localhost'))
        environment = 'development';

      posthog.identify(userData.id, {
        email: userData.email,
        user_id: userData.id,
      });

      if (environment === 'production' || environment === 'test') {
        // @ts-expect-error - StonlyWidget is not defined
        window.StonlyWidget('identify', userData.user_id);
      }
    } else {
      clearCrispUserData();
      if (posthog) {
        posthog.reset();
      }
    }
  }, [userData]);

  const value = {
    user: userData,
    isConnected: userData !== null,
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
