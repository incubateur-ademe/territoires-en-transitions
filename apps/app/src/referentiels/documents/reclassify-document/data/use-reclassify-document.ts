import { appLabels } from '@/app/labels/catalog';
import { invalidateQueries } from '@/app/referentiels/preuves/useAddPreuves';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useReclassifyDocument = (collectiviteId: number) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.collectivites.documents.updatePreuve.mutationOptions({
      meta: {
        success: appLabels.reclasserDocumentSucces,
        error: appLabels.reclasserDocumentEchec,
      },
      onSuccess: () => {
        invalidateQueries(queryClient, collectiviteId, {
          invalidateParcours: true,
          trpc,
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.referentiels.labellisations.listPreuvesLabellisation.pathKey(),
        });
      },
    })
  );
};
