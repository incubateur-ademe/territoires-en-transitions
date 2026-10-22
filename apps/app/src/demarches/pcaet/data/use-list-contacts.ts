'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/** Les référents des DREAL, conseils régionaux et DDT qui couvrent la collectivité. */
export const useListContacts = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.demarches.pcaet.listContacts.queryOptions({ collectiviteId })
  );

  return { organismes: data ?? [], isLoading };
};
