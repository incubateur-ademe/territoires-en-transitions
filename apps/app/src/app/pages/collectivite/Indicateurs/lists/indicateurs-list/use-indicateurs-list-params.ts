import { indicateursNameToParams } from '@/app/app/pages/collectivite/Indicateurs/lists/utils';
import { ListDefinitionsInputFilters } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { areIndicateurVueFiltersEqual } from '@/app/indicateurs/vues/indicateur-vue-filters.rules';
import { appLabels } from '@/app/labels/catalog';
import {
  listDefinitionsInputFiltersSchema,
  ListDefinitionsInputSort,
  listDefinitionsInputSortValues,
} from '@tet/domain/indicateurs';
import { omit, pick } from 'es-toolkit';
import {
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useCallback, useEffect, useRef } from 'react';

export type SortBy = ListDefinitionsInputSort;

type ListOptions = {
  sortBy: SortBy;
  displayGraphs: boolean;
  currentPage: number;
};

const optionsKeys: (keyof ListOptions)[] = [
  'sortBy',
  'displayGraphs',
  'currentPage',
] as const;

type SortByItem = {
  label: string;
  value: SortBy;
  direction: 'asc' | 'desc';
};

export const sortByItems: SortByItem[] = [
  {
    label: appLabels.indicateurSortCompletude,
    value: 'estRempli',
    direction: 'desc',
  },
  {
    label: appLabels.ordreAlphabetique,
    value: 'titre',
    direction: 'asc',
  },
] as const;

const optionsNameToParams: Record<keyof ListOptions, string> = {
  sortBy: '$s',
  displayGraphs: '$g',
  currentPage: '$p',
} as const;

export type SearchParams = ListDefinitionsInputFilters & ListOptions;
const searchParamsShortMap = {
  ...indicateursNameToParams,
  ...optionsNameToParams,
};

const searchParamsMap = {
  sortBy: parseAsStringLiteral(listDefinitionsInputSortValues),
  displayGraphs: parseAsBoolean,
  currentPage: parseAsInteger.withDefault(1),
  filter: parseAsJson(listDefinitionsInputFiltersSchema.parse),
};

export const listIndicateursParamsSerializer = createSerializer(
  searchParamsMap,
  { urlKeys: searchParamsShortMap }
);

export const useIndicateursListParams = (
  defaultFilters: ListDefinitionsInputFilters,
  defaultOptions?: Partial<ListOptions>
) => {
  const [queryParams, setQueryParams] = useQueryStates(
    {
      ...searchParamsMap,
      sortBy: searchParamsMap.sortBy.withDefault(
        defaultOptions?.sortBy ?? 'estRempli'
      ),
      displayGraphs: searchParamsMap.displayGraphs.withDefault(
        defaultOptions?.displayGraphs ?? true
      ),
    },
    {
      urlKeys: searchParamsShortMap,
    }
  );
  const restoreDefaultFilters = useCallback(
    () => void setQueryParams({ filter: null, currentPage: 1 }),
    [setQueryParams]
  );

  const previousDefaultFilters = useRef(defaultFilters);
  useEffect(() => {
    const hasDefaultsChanged = !areIndicateurVueFiltersEqual(
      previousDefaultFilters.current,
      defaultFilters
    );
    previousDefaultFilters.current = defaultFilters;

    // A shared vue can change on refetch while this user is on a later page.
    // An explicit URL filter remains this user's current selection.
    if (
      hasDefaultsChanged &&
      queryParams.filter === null &&
      queryParams.currentPage !== 1
    ) {
      void setQueryParams({ currentPage: 1 });
    }
  }, [
    defaultFilters,
    queryParams.filter,
    queryParams.currentPage,
    setQueryParams,
  ]);

  const resolvedFilters = queryParams.filter ?? defaultFilters;

  return {
    restoreDefaultFilters,
    searchParams: {
      ...omit(queryParams, ['filter']),
      // Resolve changing saved filters here: nuqs memoizes object defaults.
      // An explicit empty object is a reset, so only null uses the saved vue.
      ...resolvedFilters,
    },

    setSearchParams: (searchParams: Partial<SearchParams> | null) => {
      if (searchParams === null) {
        setQueryParams(null);
        return;
      }

      const nextFilters = omit(searchParams, optionsKeys);

      setQueryParams({
        ...pick(searchParams, optionsKeys),
        filter: nextFilters,
      });
    },
  };
};
