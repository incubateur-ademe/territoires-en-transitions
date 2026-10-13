'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type RecetteDossierDetail =
  RouterOutput['demarches']['pcaet']['repriseTec']['getDossier'];

export const useGetDossier = (collectiviteId: number, tecDossierId: number) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.demarches.pcaet.repriseTec.getDossier.queryOptions(
      { collectiviteId, tecDossierId },
      { retry: false }
    )
  );
};
