'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback } from 'react';

export type DemarchePcaetDiagnostic =
  RouterOutput['demarches']['pcaet']['diagnostic']['get'];

/**
 * Structure, valeurs et complétude du diagnostic. Le référentiel et les valeurs
 * viennent du serveur ; dès la transmission, `snapshotDate` signale que c'est la
 * photo du dossier déposé qui est servie.
 */
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
    snapshotDate: data?.snapshotDate ?? null,
    isLoading,
    isError,
    refetch,
  };
};

/**
 * L'année de comptabilisation conditionne la colonne de résultats et donc la
 * complétude : la démarche est invalidée avec le diagnostic pour que
 * `availableTransitions` suive.
 */
export const useSetDiagnosticYears = (demarcheId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryKey = trpc.demarches.pcaet.diagnostic.get.queryKey({
    collectiviteId,
    demarcheId,
  });

  const { mutate, isPending } = useMutation(
    trpc.demarches.pcaet.diagnostic.setYears.mutationOptions({
      meta: {
        success: appLabels.demarcheDiagnosticAnneesEnregistrees,
        error: appLabels.mutationError,
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
    })
  );

  const setYears = useCallback(
    (input: {
      topicCode: string;
      referenceYear: number;
      extraYears: number[];
    }) => mutate({ collectiviteId, demarcheId, ...input }),
    [mutate, collectiviteId, demarcheId]
  );

  /** `isPending` signale qu'une écriture est en vol : le diagnostic servi est
   * alors en retard d'un tour sur ce qui a été demandé. */
  return { setYears, isPending };
};
