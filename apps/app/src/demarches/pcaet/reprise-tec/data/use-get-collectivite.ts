'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type RecetteCollectiviteDetail =
  RouterOutput['demarches']['pcaet']['repriseTec']['getCollectivite'];

export const useGetCollectivite = (collectiviteId: number) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.demarches.pcaet.repriseTec.getCollectivite.queryOptions(
      { collectiviteId },
      { retry: false }
    )
  );
};
