'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type Entonnoir =
  RouterOutput['demarches']['pcaet']['repriseTec']['getEntonnoir'];

export const useGetEntonnoir = () => {
  const trpc = useTRPC();
  return useQuery(
    trpc.demarches.pcaet.repriseTec.getEntonnoir.queryOptions(undefined, {
      retry: false,
    })
  );
};
