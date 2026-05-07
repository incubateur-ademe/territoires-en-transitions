import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Charge les temps de mise en oeuvre
 */
export const useMiseEnOeuvre = () => {
  const trpc = useTRPC();
  return useQuery(trpc.shared.tempsDeMiseEnOeuvre.list.queryOptions());
};
