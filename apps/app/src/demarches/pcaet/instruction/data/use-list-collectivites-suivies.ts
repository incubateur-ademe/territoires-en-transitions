'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Ce qu'un service peut chercher dans sa liste d'instruction. Le territoire
 * bouge peu : chargé une fois, les suggestions s'y calculent à chaque frappe.
 */
export const useListCollectivitesSuivies = (serviceId: number) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.demarches.pcaet.listCollectivitesSuivies.queryOptions(
      { collectiviteId: serviceId },
      { staleTime: 5 * 60 * 1000 }
    )
  );
};
