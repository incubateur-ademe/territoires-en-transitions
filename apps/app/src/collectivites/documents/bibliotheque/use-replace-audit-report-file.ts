import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { invalidateQueries } from '../use-add-preuves';

export const useReplaceAuditReportFile = (collectiviteId: number) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.referentiels.labellisations.updateAuditReport.mutationOptions({
      onSuccess: () => {
        invalidateQueries({ queryClient, collectiviteId, trpc });
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.documents.listDocumentsAudit.pathKey(),
        });
      },
    })
  );
};
