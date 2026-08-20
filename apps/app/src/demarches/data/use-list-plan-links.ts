'use client';

import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type DemarchePlanLink =
  RouterOutput['demarches']['listPlanLinks'][number];

/**
 * Plans tenus par les démarches actives de la collectivité, tous types de
 * démarches confondus : sert l'exclusivité plan ↔ démarche et le bandeau
 * affiché sur un plan lié.
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
