'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type RecetteCollectivite =
  RouterOutput['demarches']['pcaet']['repriseTec']['listCollectivites'][number];

export const useListCollectivites = () => {
  const trpc = useTRPC();
  return useQuery(
    trpc.demarches.pcaet.repriseTec.listCollectivites.queryOptions(undefined, {
      retry: false,
    })
  );
};
