'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useListReferentsRegions = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.demarches.pcaet.referents.listRegions.queryOptions({ collectiviteId })
  );

  return { regions: data ?? [], isLoading };
};
