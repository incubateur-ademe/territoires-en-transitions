'use client';

import {
  TrackingProvider,
  createTrackingClient,
  getNextTrackingEnv,
} from '@tet/ui';

const client = createTrackingClient(getNextTrackingEnv());

const PHProvider = ({children}: {children: React.ReactNode}) => {
  return <TrackingProvider client={client}>{children}</TrackingProvider>;
};

export default PHProvider;
