import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import {
  FicheResume,
  listFichesRequestFiltersSchema,
} from '@/domain/plans/fiches';
import { useQuery } from '@tanstack/react-query';
import { parseAsJson, useQueryState } from 'nuqs';
import * as formatter from './filter-formatters';
import { Filters, RawFilters } from './types';

type Args = {
  parameters: {
    collectiviteId: number;
    axes: number[];
  };
};

const searchParametersSchema = listFichesRequestFiltersSchema.pick({
  noPilote: true,
  noReferent: true,
  noStatut: true,
  noPriorite: true,
  noPlan: true,
  personnePiloteIds: true,
  personneReferenteIds: true,
  statuts: true,
  priorites: true,
});

export const useFichesActionFiltresListe = ({
  parameters,
}: Args): {
  items: FicheResume[];
  total: number;
  filters: Filters;
  filtersCount: number;
  setFilters: (filters: Filters) => void;
} => {
  const collectiviteId = useCollectiviteId();
  const trpcClient = useTRPC();

  const [rawFilters, setFilters] = useQueryState(
    'filters',
    parseAsJson(searchParametersSchema.parse)
  );

  const filtersWithCollectiviteId: RawFilters = {
    ...rawFilters,
    collectiviteId,
  };

  const { data } = useQuery(
    trpcClient.plans.fiches.listResumes.queryOptions({
      collectiviteId,
      axesId: parameters.axes,
      filters: formatter.toQueryPayload(filtersWithCollectiviteId),
    })
  );

  const formattedFilters = formatter.toFilters(filtersWithCollectiviteId);

  const filterKeysToConsider: (keyof Filters)[] = [
    'pilotes',
    'referents',
    'statuts',
    'priorites',
  ] as const;

  // Calculate active filters count from the formatted filters
  const filtersCount = filterKeysToConsider.filter((key) => {
    const value = formattedFilters[key as keyof Filters];
    if (Array.isArray(value)) {
      return value?.length > 0;
    }
    return !!value;
  }).length;

  const setFiltersHandler = (filters: Filters) => {
    const rawFilters = formatter.splitReferentsAndPilotesIds(filters);
    const queryPayload = formatter.toQueryPayload(rawFilters);
    setFilters(queryPayload);
  };

  return {
    ...(data
      ? { items: data.data, total: data.count }
      : { items: [], total: 0 }),
    filters: formattedFilters,
    setFilters: setFiltersHandler,
    filtersCount,
  };
};
