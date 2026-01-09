'use client';

import dynamic from 'next/dynamic';

export const TrpcWithReactQueryProvider = dynamic(
  () => import('./trpc-with-react-query.provider'),
  { ssr: false }
);

export const useTrpc = TrpcWithReactQueryProvider.useTRPC;
