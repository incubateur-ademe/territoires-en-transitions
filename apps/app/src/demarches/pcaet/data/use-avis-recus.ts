'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Les avis rendus sur la démarche, lus côté collectivité déposante.
 *
 * Seuls les avis validés remontent : un brouillon de l'instructeur ne sort pas
 * de son espace.
 */
export const useDemarchePcaetAvisRecus = ({
  collectiviteId,
  demarcheId,
  enabled = true,
}: {
  collectiviteId: number;
  demarcheId: number;
  enabled?: boolean;
}) => {
  const trpc = useTRPC();

  const { data, isLoading, isError } = useQuery(
    trpc.demarches.pcaet.listAvisRecus.queryOptions(
      { collectiviteId, demarcheId },
      { enabled }
    )
  );

  return { avisRecus: data ?? [], isLoading, isError };
};
