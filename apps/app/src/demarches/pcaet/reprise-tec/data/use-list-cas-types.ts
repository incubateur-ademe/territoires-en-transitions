'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type CasTypes =
  RouterOutput['demarches']['pcaet']['repriseTec']['listCasTypes'];

export const useListCasTypes = () => {
  const trpc = useTRPC();
  return useQuery(
    trpc.demarches.pcaet.repriseTec.listCasTypes.queryOptions(undefined, {
      retry: false,
    })
  );
};
