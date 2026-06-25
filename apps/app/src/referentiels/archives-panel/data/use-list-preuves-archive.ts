import { useTRPC } from '@tet/api';
import { useQuery } from '@tanstack/react-query';
import { ReferentielId } from '@tet/domain/referentiels';
import { isArchiveInFlight } from '../archive-output-to-details-state';

const POLLING_INTERVAL_MS = 2000;

export function useListPreuvesArchive(
  collectiviteId: number,
  referentielId: ReferentielId
) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.referentiels.preuvesArchive.list.queryOptions({
      collectiviteId,
      referentielId,
    }),
    refetchInterval: (query) =>
      query.state.data?.some(isArchiveInFlight) ? POLLING_INTERVAL_MS : false,
  });
}
