import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { ITEM_ALL } from '@tet/ui';
import { useQueryStates } from 'nuqs';
import { filtersParsers, filtersUrlKeys, SetFilters } from './filters';
import { HistoriqueProps } from './types';

/** vérifie si ITEM_ALL n'est pas présent dans un filtre */
const isValidFilter = (
  values: string[] | undefined | null
): values is string[] => Array.isArray(values) && !values.includes(ITEM_ALL);

/**
 * Les dernières modifications d'une collectivité
 */
export const useHistoriqueItemListe = ({
  actionId,
  referentielId,
}: {
  actionId?: string;
  referentielId?: ReferentielId;
} = {}): HistoriqueProps => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();

  // Filtres URL gérés par nuqs
  const [filters, setQueryStates] = useQueryStates(filtersParsers, {
    urlKeys: filtersUrlKeys,
  });

  const setFilters: SetFilters = (patch) => {
    void setQueryStates(patch);
  };

  const { modifiedBy, types, startDate, endDate, page } = filters;

  const { data, isLoading, isError } = useQuery(
    trpc.referentiels.historique.list.queryOptions({
      collectiviteId,
      actionId,
      referentielId,
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
