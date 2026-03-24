import { useSnapshotComputeAndUpdate } from '@/app/referentiels/use-snapshot';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Event, useEventTracker } from '@tet/ui';

export function useSetValeursUtilisees() {
  const trackEvent = useEventTracker();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { computeScoreAndUpdateCurrentSnapshot } =
    useSnapshotComputeAndUpdate();
  const { setToast } = useToastContext();

  return useMutation(
    trpc.referentiels.actions.setValeursUtilisees.mutationOptions({
      onSuccess: (data, variables) => {
        const { collectiviteId, actionId } = variables;
        setToast('success', 'Les données ont bien été enregistrées');
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
