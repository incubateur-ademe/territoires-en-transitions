'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';

export const useListDemarchesPcaet = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();
  return useQuery(trpc.demarches.pcaet.list.queryOptions({ collectiviteId }));
};
