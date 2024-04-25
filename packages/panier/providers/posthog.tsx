'use client';

import {
  TrackingProvider,
  createTrackingClient,
  getNextTrackingEnv,
} from '@tet/ui';

const client = createTrackingClient(getNextTrackingEnv());

export const PHProvider = ({children}: {children: React.ReactNode}) => {
  return <TrackingProvider client={client}>{children}</TrackingProvider>;
};
