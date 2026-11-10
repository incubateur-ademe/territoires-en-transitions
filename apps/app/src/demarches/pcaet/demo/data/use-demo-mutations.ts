'use client';

import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useMemo } from 'react';

/**
 * Un raccourci de démo écrit un peu partout (pièces, diagnostic, plans,
 * statut) : tout le dépôt PCAET et les plans se relisent.
 */
const useInvalidateDemarchesPcaet = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMemo(
    () => async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.demarches.pcaet.pathKey(),
        }),
        queryClient.invalidateQueries({ queryKey: trpc.plans.pathKey() }),
      ]);
    },
    [queryClient, trpc]
  );
};

export const useCompleterEtapeDemo = () => {
  const trpc = useTRPC();
  const onSuccess = useInvalidateDemarchesPcaet();
  return useMutation(
    trpc.demarches.pcaet.demo.completerEtape.mutationOptions({
      onSuccess,
      meta: {
        success: appLabels.demarcheDemoCompleterEtapeSucces,
        error: appLabels.demarcheDemoErreur,
      },
    })
  );
};

export const useSimulerAvisDemo = () => {
  const trpc = useTRPC();
  const onSuccess = useInvalidateDemarchesPcaet();
  return useMutation(
    trpc.demarches.pcaet.demo.simulerAvis.mutationOptions({
      onSuccess,
      meta: {
        success: appLabels.demarcheDemoSimulerAvisSucces,
        error: appLabels.demarcheDemoErreur,
      },
    })
  );
};

export const useReputerFavorableDemo = () => {
  const trpc = useTRPC();
  const onSuccess = useInvalidateDemarchesPcaet();
  return useMutation(
    trpc.demarches.pcaet.demo.reputerFavorable.mutationOptions({
      onSuccess,
      meta: {
        success: appLabels.demarcheDemoReputerFavorableSucces,
        error: appLabels.demarcheDemoErreur,
      },
    })
  );
};
