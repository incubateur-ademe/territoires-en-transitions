import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Charge la liste des régions.
 */
export const useListRegions = () => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.shared.regions.list.queryOptions());
  return {
    isLoading,
    regions: data || [],
  };
};
