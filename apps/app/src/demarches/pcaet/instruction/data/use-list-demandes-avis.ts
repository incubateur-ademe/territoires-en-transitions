'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { parseAsInteger, parseAsStringLiteral, useQueryStates } from 'nuqs';

const SORT_VALUES = ['echeance', 'collectivite', 'contact', 'statut'] as const;
const DIRECTION_VALUES = ['asc', 'desc'] as const;

const LIMIT = 10;

export const useListDemandesAvis = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();

  const [{ page, sort, direction }, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    sort: parseAsStringLiteral(SORT_VALUES).withDefault('echeance'),
    // Voir le défaut serveur : échéance décroissante, donc transmissions les
    // plus récentes en tête.
    direction: parseAsStringLiteral(DIRECTION_VALUES).withDefault('desc'),
  });

  const { data, isLoading, isError, refetch } = useQuery(
    trpc.demarches.pcaet.listDemandesAvis.queryOptions({
      collectiviteId,
      page,
      limit: LIMIT,
      sort,
      direction,
    })
  );

  const trierPar = (colonne: (typeof SORT_VALUES)[number]) =>
    setParams({
      sort: colonne,
      direction: sort === colonne && direction === 'asc' ? 'desc' : 'asc',
      page: 1,
    });

  return {
    data,
    isLoading,
    isError,
    refetch,
    page,
    limit: LIMIT,
    setPage: (nouvellePage: number) => setParams({ page: nouvellePage }),
    trierPar,
  };
};
