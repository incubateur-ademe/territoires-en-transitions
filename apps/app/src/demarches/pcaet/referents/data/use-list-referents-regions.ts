'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useListReferentsRegions = ({
  collectiviteId,
  enabled = true,
}: {
  collectiviteId: number;
  enabled?: boolean;
}) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.demarches.pcaet.referents.listRegions.queryOptions(
      { collectiviteId },
      { enabled }
    )
  );

  return { regions: data ?? [], isLoading };
};
