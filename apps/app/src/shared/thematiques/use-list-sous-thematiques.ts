import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useListSousThematiques = () => {
  const trpc = useTRPC();
  return useQuery(trpc.shared.thematiques.listSousThematiques.queryOptions());
};
