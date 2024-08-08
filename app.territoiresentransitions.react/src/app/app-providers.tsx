'use client';

import {createTheme, ThemeProvider} from '@mui/material/styles';
import {createTrackingClient, TrackingProvider} from '@tet/ui';
import {QueryClient, QueryClientProvider} from 'react-query';
import {ReactQueryDevtools} from 'react-query/devtools';
import {AuthProvider} from '../core-logic/api/auth/AuthProvider';
import {ENV} from '../environmentVariables';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000091',
    },
  },
});

const queryClient = new QueryClient();

export default function AppProviders({children}: {children: React.ReactNode}) {
  const trackingClient = createTrackingClient(ENV.posthog);

  return (
    <TrackingProvider client={trackingClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <ReactQueryDevtools initialIsOpen={false} />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </TrackingProvider>
  );
}
