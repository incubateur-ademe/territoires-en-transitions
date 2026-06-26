import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { invalidateQueries } from '../useAddPreuves';

export const useReplaceAuditReportFile = (collectiviteId: number) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.referentiels.labellisations.updateAuditReport.mutationOptions({
      onSuccess: () => {
        invalidateQueries(queryClient, collectiviteId, {
          invalidateParcours: false,
          trpc,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.listPreuvesAudit.pathKey(),
        });
      },
    })
  );
};
