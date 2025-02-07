'use client';

import { ENV } from '@/api/environmentVariables';
import { TRPCProvider } from '@/api/utils/trpc/client';
import { E2E } from '@/app/app/E2E';
import { Toasters } from '@/app/app/Toasters';
import { VisitTracker } from '@/app/app/VisitTracker';
import AccepterCGUModal from '@/app/app/pages/Auth/AccepterCGUModal';
import { ScoreListenerProvider } from '@/app/referentiels/DEPRECATED_use-score-listener';
import { UserDetails } from '@/app/users/fetch-user-details.server';
import { UserProvider } from '@/app/users/user-provider';
import { createTrackingClient, TrackingProvider } from '@/ui';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000091',
    },
  },
});

const trackingClient = createTrackingClient(ENV.posthog);
const queryClient = new QueryClient();

export default function AppProviders({
  user,
  children,
}: {
  user: UserDetails;
  children: ReactNode;
}) {
  return (
    <TrackingProvider client={trackingClient}>
      <TRPCProvider>
        <QueryClientProvider client={queryClient}>
          <UserProvider user={user}>
            <Toasters />
            <ScoreListenerProvider>
              <E2E />
              <VisitTracker />
              <AccepterCGUModal />
              <ThemeProvider theme={theme}>
                <ReactQueryDevtools initialIsOpen={false} />
                {children}
              </ThemeProvider>
            </ScoreListenerProvider>
          </UserProvider>
        </QueryClientProvider>
      </TRPCProvider>
    </TrackingProvider>
  );
}
