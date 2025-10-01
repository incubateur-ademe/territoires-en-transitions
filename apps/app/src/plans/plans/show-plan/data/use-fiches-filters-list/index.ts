import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import {
  FicheResume,
  listFichesRequestFiltersSchema,
} from '@/domain/plans/fiches';
import { useQuery } from '@tanstack/react-query';
import { parseAsJson, useQueryState } from 'nuqs';
import * as formatter from './filter-formatters';
import { Filters, FormFilters } from './types';

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

const countActiveFilters = (formattedFilters: FormFilters): number => {
  const filterKeysToConsider: (keyof FormFilters)[] = [
    'pilotes',
    'referents',
    'statuts',
    'priorites',
  ] as const;

  return filterKeysToConsider.filter((key) => {
    const value = formattedFilters[key as keyof FormFilters];
    if (Array.isArray(value)) {
      return value?.length > 0;
    }
    return !!value;
  }).length;
};

export const useFichesActionFiltresListe = ({
  parameters,
}: Args): {
  items: FicheResume[];
  isLoading: boolean;
  total: number;
  filters: FormFilters;
  filtersCount: number;
  setFilters: (filters: FormFilters) => void;
} => {
  const collectiviteId = useCollectiviteId();
  const trpcClient = useTRPC();

  const [rawFilters, setFilters] = useQueryState(
    'filters',
    parseAsJson(searchParametersSchema.parse)
  );

  const filtersWithCollectiviteId: Filters = {
    ...rawFilters,
    collectiviteId,
  };

  const { data, isLoading } = useQuery(
    trpcClient.plans.fiches.listFiches.queryOptions({
      collectiviteId,
      filters: {
        ...formatter.toQueryPayload(filtersWithCollectiviteId),
        axesId: parameters.axes,
      },
    })
  );

  const formattedFilters = formatter.toFilters(filtersWithCollectiviteId);

  const setFiltersHandler = (filters: FormFilters) => {
    const rawFilters = formatter.splitReferentsAndPilotesIds(filters);
    setFilters(rawFilters);
  };

  return {
    ...(data
      ? { items: data.data, total: data.count }
      : { items: [], total: 0 }),
    isLoading,
    filters: formattedFilters,
    setFilters: setFiltersHandler,
    filtersCount: countActiveFilters(formattedFilters),
  };
};
