'use client';

import { TrackingProvider } from '@/ui';

const PHProvider = ({ children }: { children: React.ReactNode }) => {
  return <TrackingProvider>{children}</TrackingProvider>;
};

export default PHProvider;
