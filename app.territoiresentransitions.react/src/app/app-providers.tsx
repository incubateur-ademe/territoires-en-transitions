'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { createTrackingClient, TrackingProvider } from '@tet/ui';
import { ENV } from 'environmentVariables';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider } from '../core-logic/api/auth/AuthProvider';
import { TRPCProvider } from '@tet/api/utils/trpc/client';

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
          <AuthProvider>
            <ThemeProvider theme={theme}>
              <ReactQueryDevtools initialIsOpen={false} />
              {children}
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TRPCProvider>
    </TrackingProvider>
  );
}
