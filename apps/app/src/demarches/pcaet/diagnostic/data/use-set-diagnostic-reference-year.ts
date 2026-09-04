'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';

export type SetDiagnosticReferenceYearInput =
  RouterInput['demarches']['pcaet']['diagnostic']['indicateurs']['setReferenceYear'];

/**
 * L'année de référence n'est pas une donnée en propre : elle se lit dans les
 * années des résultats saisis. La changer bascule donc les valeurs du tableau
 * sur la nouvelle année, côté serveur et en une seule requête.
 */
export const useSetDiagnosticReferenceYear = (demarcheId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryKey = trpc.demarches.pcaet.diagnostic.get.queryKey({
    collectiviteId,
    demarcheId,
  });

  const { mutateAsync, isPending } = useMutation(
    trpc.demarches.pcaet.diagnostic.indicateurs.setReferenceYear.mutationOptions(
      {
        meta: {
          success: appLabels.pcaetDiagnosticAnneeReferenceBasculee,
          error: appLabels.pcaetDiagnosticAnneeReferenceEchec,
        },

        onSuccess: async (diagnostic) => {
          queryClient.setQueryData(queryKey, diagnostic);

          await queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.get.queryKey({
              collectiviteId,
              demarcheId,
            }),
          });
        },
      }
    )
  );

  const setReferenceYear = useCallback(
    ({
      indicateurIds,
      fromYear,
      toYear,
    }: Pick<
      SetDiagnosticReferenceYearInput,
      'indicateurIds' | 'fromYear' | 'toYear'
    >) =>
      mutateAsync({
        collectiviteId,
        demarcheId,
        indicateurIds,
        fromYear,
        toYear,
      }),
    [mutateAsync, collectiviteId, demarcheId]
  );

  return { setReferenceYear, isPending };
};
