'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type DemarchePlanLink =
  RouterOutput['demarches']['listPlanLinks'][number];

/**
 * Plans tenus par une démarche de la collectivité, tous statuts et tous
 * types de démarches confondus. Ne filtre pas par statut : le bandeau doit
 * voir un plan lié quelle que soit la démarche (même adoptée), tandis que
 * l'exclusivité plan ↔ démarche ne doit bloquer que les démarches actives —
 * à chaque consommateur d'appliquer `isActiveDemarchePcaetStatus(link.status)`
 * s'il a besoin de ce filtre (cf. plan.section.tsx).
 */
export const useListDemarchePlanLinks = (
  collectiviteId: number,
  opts?: { enabled?: boolean }
) => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.demarches.listPlanLinks.queryOptions({ collectiviteId }, opts)
  );

  return { links: data ?? [], isLoading };
};
