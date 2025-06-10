import { trpc } from "@/api/utils/trpc/client";

export function useSetValeursUtilisees() {
  const trpcUtils = trpc.useUtils();

  return trpc.referentiels.actions.setValeursUtilisees.useMutation({
    onSuccess: (data, { collectiviteId, actionId }) => {
      const input = {
        collectiviteId,
        actionIds: [actionId]
      };
      trpcUtils.referentiels.actions.getValeursUtilisees.invalidate(input);
      trpcUtils.referentiels.actions.getValeursUtilisables.invalidate(input);
      trpcUtils.referentiels.actions.getScoreIndicatif.invalidate(input);
    }
  });
}
