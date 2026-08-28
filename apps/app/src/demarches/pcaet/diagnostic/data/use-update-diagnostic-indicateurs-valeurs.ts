'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';

export type UpdateDiagnosticIndicateursValeursInput =
  RouterInput['demarches']['pcaet']['diagnostic']['indicateurs']['updateValeurs'];

export const useUpdateDiagnosticIndicateursValeurs = (demarcheId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryKey = trpc.demarches.pcaet.diagnostic.get.queryKey({
    collectiviteId,
    demarcheId,
  });

  const { mutateAsync, isPending } = useMutation(
    trpc.demarches.pcaet.diagnostic.indicateurs.updateValeurs.mutationOptions({
      meta: { disableToast: true },

      onSuccess: async (diagnostic) => {
        queryClient.setQueryData(queryKey, diagnostic);

        await queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.get.queryKey({
            collectiviteId,
            demarcheId,
          }),
        });
      },
    })
  );

  const updateIndicateurValeurs = useCallback(
    ({
      valeurs,
    }: {
      valeurs: UpdateDiagnosticIndicateursValeursInput['valeurs'];
    }) =>
      mutateAsync({
        collectiviteId,
        demarcheId,
        valeurs,
      }),
    [mutateAsync, collectiviteId, demarcheId]
  );

  return { updateIndicateurValeurs, isPending };
};
