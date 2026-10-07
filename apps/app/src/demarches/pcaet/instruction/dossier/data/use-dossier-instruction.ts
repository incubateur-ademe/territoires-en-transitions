'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import type { DossierInstructionRef } from '../../dossier-instruction-ref';

export const useDossierInstruction = (dossierRef: DossierInstructionRef) => {
  const trpc = useTRPC();

  const {
    data: dossier,
    isLoading,
    isError,
    refetch,
  } = useQuery(
    trpc.demarches.pcaet.getDossierInstruction.queryOptions(dossierRef)
  );

  return { dossier, isLoading, isError, refetch };
};
