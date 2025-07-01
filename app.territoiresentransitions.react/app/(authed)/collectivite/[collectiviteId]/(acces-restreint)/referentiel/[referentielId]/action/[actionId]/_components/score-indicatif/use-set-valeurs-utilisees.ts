import { trpc } from "@/api/utils/trpc/client";
import { useSnapshotComputeAndUpdate } from '@/app/referentiels/use-snapshot';
import { getReferentielIdFromActionId } from '@/domain/referentiels';
import { Event, useEventTracker } from '@/ui';

export function useSetValeursUtilisees() {
  const trpcUtils = trpc.useUtils();
  const trackEvent = useEventTracker();
  const { computeScoreAndUpdateCurrentSnapshot } =
    useSnapshotComputeAndUpdate();

  return trpc.referentiels.actions.setValeursUtilisees.useMutation({
    onSuccess: (data, variables) => {
      const { collectiviteId, actionId } = variables;
      const input = {
        collectiviteId,
        actionIds: [actionId],
      };
      trpcUtils.referentiels.actions.getValeursUtilisees.invalidate(input);
      trpcUtils.referentiels.actions.getValeursUtilisables.invalidate(input);
      trpcUtils.referentiels.actions.getScoreIndicatif.invalidate(input);
      computeScoreAndUpdateCurrentSnapshot({
        collectiviteId,
        referentielId: getReferentielIdFromActionId(actionId),
      });
      return trackEvent(
        Event.referentiels.submitValeursUtiliseesScoreIndicatif,
        variables
      );
    },
  });
}
