'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useListDatesSaisine = (demandeAvisId: number) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.demarches.pcaet.listDatesSaisine.queryOptions({ demandeAvisId })
  );
};
