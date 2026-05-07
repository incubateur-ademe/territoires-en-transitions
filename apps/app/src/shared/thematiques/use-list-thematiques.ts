import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useListThematiques = () => {
  const trpc = useTRPC();
  return useQuery(trpc.shared.thematiques.list.queryOptions());
};
