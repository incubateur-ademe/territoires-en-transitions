'use client';

import { ENV } from '@/api/environmentVariables';
import { TRPCProvider } from '@/api/utils/trpc/client';
import { E2E } from '@/app/app/E2E';
import { Redirector } from '@/app/app/Redirector';
import { Toasters } from '@/app/app/Toasters';
import { VisitTracker } from '@/app/app/VisitTracker';
import AccepterCGUModal from '@/app/app/pages/Auth/AccepterCGUModal';
import { ScoreListenerProvider } from '@/app/referentiels/DEPRECATED_use-score-listener';
import { createTrackingClient, TrackingProvider } from '@/ui';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider } from '../src/core-logic/api/auth/AuthProvider';

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
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TrackingProvider client={trackingClient}>
      <TRPCProvider>
        <QueryClientProvider client={queryClient}>
          <Toasters />
          <AuthProvider>
            <ScoreListenerProvider>
              <E2E />
              <Redirector />
              <VisitTracker />
              <AccepterCGUModal />
              <ThemeProvider theme={theme}>
                <ReactQueryDevtools initialIsOpen={false} />
                {children}
              </ThemeProvider>
            </ScoreListenerProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TRPCProvider>
    </TrackingProvider>
  );
}
