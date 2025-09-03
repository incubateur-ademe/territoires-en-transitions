'use client';

import { UserDetails } from '@/api/users/user-details.fetch.server';
import { UserProvider } from '@/api/users/user-provider';
import { ReactQueryAndTRPCProvider } from '@/api/utils/trpc/client';
import { NPSTracker } from '@/app/app/NPSTracker';
import AccepterCGUModal from '@/app/app/pages/Auth/AccepterCGUModal';
import { Toasters } from '@/app/app/Toasters';
import { DemoModeProvider } from '@/app/users/demo-mode-support-provider';
import { datadogLogs } from '@datadog/browser-logs';
import { setUser } from '@sentry/nextjs';
import posthog from 'posthog-js';
import { ReactNode } from 'react';

export default function AppProviders({
  user,
  children,
}: {
  user: UserDetails;
  children: ReactNode;
}) {
  return (
    <UserProvider
      user={user}
      onInitialSession={(user, session) => {
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          user_id: session?.user.id,
        });

        datadogLogs.setUser({ id: session?.user.id });

        setUser({
          id: session?.user.id,
        });

        setCrispUserData(user);

        if (process.env.NODE_ENV === 'production') {
          // @ts-expect-error - StonlyWidget is not defined
          window.StonlyWidget('identify', user.id);
        }
      }}
      onSignedOut={() => {
        posthog.reset();
        clearCrispUserData();

        datadogLogs.clearUser();

        setUser(null);
      }}
    >
      <ReactQueryAndTRPCProvider>
        <DemoModeProvider>
          <Toasters />
          <NPSTracker />
          <AccepterCGUModal />
          {children}
        </DemoModeProvider>
      </ReactQueryAndTRPCProvider>
    </UserProvider>
  );
}

declare global {
  interface Window {
    $crisp: {
      push: (args: [action: string, method: string, value?: string[]]) => void;
    };
  }
}

export const setCrispSegments = (segments: string[]) => {
  if ('$crisp' in window && segments?.length) {
    const { $crisp } = window;
    datadogLogs.logger.info(`Setting crisp segments: ${segments.join(', ')}`);
    $crisp.push(['set', 'session:segments', [segments]], true);
  }
};

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
