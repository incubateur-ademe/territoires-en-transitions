'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useDossierInstruction = (demandeAvisId: number) => {
  const trpc = useTRPC();

  const {
    data: dossier,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    trpc.demarches.pcaet.getDossierInstruction.queryOptions({ demandeAvisId })
  );

  return { dossier, isLoading, isError, refetch };
};
