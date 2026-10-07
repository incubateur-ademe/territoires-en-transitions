'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { DossierInstructionRef } from '../../dossier-instruction-ref';

export const useDiagnosticInstruction = (dossierRef: DossierInstructionRef) => {
  const trpc = useTRPC();

  const {
    data: diagnostic,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    trpc.demarches.pcaet.getDiagnosticInstruction.queryOptions(dossierRef)
  );

  return { diagnostic, isLoading, isError, refetch };
};
