import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ITEM_ALL } from '@tet/ui';
import { useQueryStates } from 'nuqs';
import { filtersParsers, filtersUrlKeys } from './filters';
import { THistoriqueProps } from './types';

/** vérifie si ITEM_ALL n'est pas présent dans un filtre */
const isValidFilter = (
  values: string[] | undefined | null
): values is string[] => Array.isArray(values) && !values.includes(ITEM_ALL);

/**
 * Les dernières modifications d'une collectivité
 */
export const useHistoriqueItemListe = ({
  actionId,
}: {
  actionId?: string;
} = {}): THistoriqueProps => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();

  // Filtres URL gérés par nuqs
  const [filters, setFilters] = useQueryStates(filtersParsers, {
    urlKeys: filtersUrlKeys,
  });

  const { modifiedBy, types, startDate, endDate, page } = filters;

  const { data, isLoading, isError } = useQuery(
    trpc.referentiels.historique.list.queryOptions({
      collectiviteId,
      actionId,
      filters: {
        modifiedBy: isValidFilter(modifiedBy) ? modifiedBy : undefined,
        types: isValidFilter(types) ? types : undefined,
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
        page: page ?? undefined,
      },
    })
  );

  return {
    ...(data ?? { items: [], total: 0 }),
    filters,
    setFilters,
    isLoading,
    isError,
  };
};
