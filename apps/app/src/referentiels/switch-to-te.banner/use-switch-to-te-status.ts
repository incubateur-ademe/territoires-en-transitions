import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type SwitchToTeStatus =
  RouterOutput['referentiels']['getSwitchToTeStatus'];

/**
 * Statut de la bascule vers TE (droits, blocages COT/audit, éligibilité)
 */
export function useSwitchToTeStatus() {
  const trpc = useTRPC();
  const collectiviteId = useCollectiviteId();

  return useQuery(
    trpc.referentiels.getSwitchToTeStatus.queryOptions({
      collectiviteId,
    })
  );
}
