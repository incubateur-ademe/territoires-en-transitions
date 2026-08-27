'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';
import type { CellValueInput } from '@/app/indicateurs/valeurs/grid/types';

export type DemarchePcaetDiagnostic =
  RouterOutput['demarches']['pcaet']['diagnostic']['get'];

/** Structure, valeurs et complétude du diagnostic (toujours live). */
export const useDemarchePcaetDiagnostic = (demarcheId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const { data, isLoading, isError, refetch } = useQuery(
    trpc.demarches.pcaet.diagnostic.get.queryOptions({
      collectiviteId,
      demarcheId,
    })
  );

  return {
    topics: data?.topics ?? [],
    isLoading,
    isError,
    refetch,
  };
};

export type UpdateDiagnosticIndicateursValeurs = (input: {
  valeurs: CellValueInput[];
}) => Promise<unknown>;

export const useUpdateDiagnosticIndicateursValeurs = (
  demarcheId: number
) => {
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

  const updateValeurs: UpdateDiagnosticIndicateursValeurs = useCallback(
    (input) =>
      mutateAsync({
        collectiviteId,
        demarcheId,
        valeurs: input.valeurs,
      }),
    [mutateAsync, collectiviteId, demarcheId]
  );

  return { updateValeurs, isPending };
};
