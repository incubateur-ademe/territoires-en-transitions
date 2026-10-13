'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type Decisions =
  RouterOutput['demarches']['pcaet']['repriseTec']['listDecisions'];

export const useListDecisions = () => {
  const trpc = useTRPC();
  return useQuery(
    trpc.demarches.pcaet.repriseTec.listDecisions.queryOptions(undefined, {
      retry: false,
    })
  );
};
