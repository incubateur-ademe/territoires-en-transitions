'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useDiagnosticInstruction = (demandeAvisId: number) => {
  const trpc = useTRPC();

  const {
    data: diagnostic,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    trpc.demarches.pcaet.getDiagnosticInstruction.queryOptions({
      demandeAvisId,
    })
  );

  return { diagnostic, isLoading, isError, refetch };
};
