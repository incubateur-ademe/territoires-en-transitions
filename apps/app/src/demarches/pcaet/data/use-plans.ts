'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Le programme d'actions rattaché à la démarche, aplati et en lecture seule.
 *
 * Même contenu que celui remis à l'instructeur : c'est un rappel du dossier
 * transmis. Le rattachement des plans, lui, passe par les routes `plans`.
 */
export const useDemarchePcaetPlans = ({
  collectiviteId,
  demarcheId,
  enabled = true,
}: {
  collectiviteId: number;
  demarcheId: number;
  enabled?: boolean;
}) => {
  const trpc = useTRPC();

  const { data, isLoading, isError, refetch } = useQuery(
    trpc.demarches.pcaet.listPlans.queryOptions(
      { collectiviteId, demarcheId },
      { enabled }
    )
  );

  return { plans: data ?? [], isLoading, isError, refetch };
};
