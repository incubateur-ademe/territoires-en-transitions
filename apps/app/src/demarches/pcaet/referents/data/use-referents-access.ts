'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/** Seuls les membres de la DGEC lisent, et en édition gèrent, les référents. */
export const useReferentsAccess = ({
  collectiviteId,
  enabled = true,
}: {
  collectiviteId: number;
  enabled?: boolean;
}) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.demarches.pcaet.referents.getAccess.queryOptions(
      { collectiviteId },
      { enabled }
    )
  );

  return {
    canRead: data?.canRead ?? false,
    canMutate: data?.canMutate ?? false,
    isLoading,
  };
};
