import { useTRPC } from '@/api/utils/trpc/client';
import { useSnapshotComputeAndUpdate } from '@/app/referentiels/use-snapshot';
import { getReferentielIdFromActionId } from '@/domain/referentiels';
import { Event, useEventTracker } from '@/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSetValeursUtilisees() {
  const trackEvent = useEventTracker();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { computeScoreAndUpdateCurrentSnapshot } =
    useSnapshotComputeAndUpdate();

  return useMutation(
    trpc.referentiels.actions.setValeursUtilisees.mutationOptions({
      onSuccess: (data, variables) => {
        const { collectiviteId, actionId } = variables;
        const input = {
          collectiviteId,
          actionIds: [actionId],
        };
        queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.actions.getValeursUtilisees.queryKey(input),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.actions.getValeursUtilisables.queryKey(input),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.getScoreIndicatif.queryKey(input),
        });
        computeScoreAndUpdateCurrentSnapshot({
          collectiviteId,
          referentielId: getReferentielIdFromActionId(actionId),
        });
        return trackEvent(
          Event.referentiels.submitValeursUtiliseesScoreIndicatif,
          variables
        );
      },
    })
  );
}
