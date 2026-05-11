import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Charge la liste des départements.
 */
export const useListDepartements = () => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.shared.departements.list.queryOptions()
  );
  return {
    isLoading,
    departements: data || [],
  };
};
