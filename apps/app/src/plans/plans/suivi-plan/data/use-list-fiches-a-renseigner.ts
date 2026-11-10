import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { faireAvancerLePlanFilters } from '@tet/domain/plans';
import { useState } from 'react';

const queryOptions = {
  limit: 'all' as const,
  sort: [{ field: 'titre' as const, direction: 'asc' as const }],
};

export const useListFichesARenseigner = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const trpc = useTRPC();
  const [ficheIds, setFicheIds] = useState<number[] | null>(null);

  const { data: fichesARenseigner } = useQuery(
    trpc.plans.fiches.listFiches.queryOptions(
      {
        collectiviteId,
        filters: {
          planActionIds: [planId],
          ...faireAvancerLePlanFilters.enCoursSansAvancement,
        },
        queryOptions,
      },
      { enabled: ficheIds === null, staleTime: 0 }
    )
  );

  if (ficheIds === null && fichesARenseigner) {
    setFicheIds(fichesARenseigner.data.map((fiche) => fiche.id));
  }

  const { data: fiches } = useQuery(
    trpc.plans.fiches.listFiches.queryOptions(
      { collectiviteId, filters: { ficheIds: ficheIds ?? [] }, queryOptions },
      { enabled: !!ficheIds?.length }
    )
  );

  if (ficheIds === null) {
    return undefined;
  }
  if (ficheIds.length === 0) {
    return [];
  }
  return fiches?.data;
};
