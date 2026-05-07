import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Charge les effets attendus
 */
export const useEffetsAttendus = () => {
  const trpc = useTRPC();
  return useQuery(trpc.shared.effetsAttendus.list.queryOptions());
};
