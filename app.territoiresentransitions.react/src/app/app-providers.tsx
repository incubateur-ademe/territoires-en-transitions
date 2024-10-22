'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  QueryClient as TanstackQueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from '@tanstack/react-query';
import { createTrackingClient, TrackingProvider } from '@tet/ui';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider } from '../core-logic/api/auth/AuthProvider';
import { ENV } from '../environmentVariables';
import { trpc, trpcClient } from '../utils/trpc';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000091',
    },
  },
});

const trackingClient = createTrackingClient(ENV.posthog);
const queryClient = new QueryClient();
const tanstackQueryClient = new TanstackQueryClient();

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TrackingProvider client={trackingClient}>
      <trpc.Provider client={trpcClient} queryClient={tanstackQueryClient}>
        <TanstackQueryClientProvider client={tanstackQueryClient}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemeProvider theme={theme}>
                <ReactQueryDevtools initialIsOpen={false} />
                {children}
              </ThemeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </TanstackQueryClientProvider>
      </trpc.Provider>
    </TrackingProvider>
  );
}
