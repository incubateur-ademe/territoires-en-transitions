import { indicateursNameToParams } from '@/app/app/pages/collectivite/Indicateurs/lists/utils';
import { ListDefinitionsInputFilters } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import {
  listDefinitionsInputFiltersSchema,
  ListDefinitionsInputSort,
  listDefinitionsInputSortValues,
} from '@/domain/indicateurs';
import { omit, pick } from 'es-toolkit';
import {
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

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
    label: 'Complétude',
    value: 'estRempli',
    direction: 'desc',
  },
  {
    label: 'Ordre alphabétique',
    value: 'titre',
    direction: 'asc',
  },
] as const;

// correspondances entre le nom d'une option et un searchParam dans l'url
// (on préfixe les searchParams avec $ pour éviter une éventuelle collision avec les filtres)
const optionsNameToParams: Record<keyof ListOptions, string> = {
  sortBy: '$s',
  displayGraphs: '$g',
  currentPage: '$p',
} as const;

export type SearchParams = ListDefinitionsInputFilters & ListOptions;
export const searchParamsShortMap = {
  ...indicateursNameToParams,
  ...optionsNameToParams,
};

const searchParamsMap = {
  sortBy: parseAsStringLiteral(listDefinitionsInputSortValues),
  displayGraphs: parseAsBoolean,
  currentPage: parseAsInteger.withDefault(1),
  filter: parseAsJson(listDefinitionsInputFiltersSchema.parse),
};

export const listIndicateursParamsSerializer =
  createSerializer(searchParamsMap);

/** Gère les paramètres d'une liste d'indicateurs */
export const useIndicateursListParams = (
  defaultFilters: ListDefinitionsInputFilters,
  defaultOptions?: Partial<ListOptions>
) => {
  const [searchParams, setSearchParams] = useQueryStates(
    {
      ...searchParamsMap,
      sortBy: searchParamsMap.sortBy.withDefault(
        defaultOptions?.sortBy ?? 'estRempli'
      ),
      displayGraphs: searchParamsMap.displayGraphs.withDefault(
        defaultOptions?.displayGraphs ?? true
      ),
      filter: searchParamsMap.filter.withDefault(defaultFilters),
    },
    {
      urlKeys: searchParamsShortMap,
    }
  );

  return {
    searchParams: {
      ...omit(searchParams, ['filter']),
      ...searchParams.filter,
    },

    setSearchParams: (searchParams: Partial<SearchParams> | null) => {
      if (searchParams === null) {
        setSearchParams(null);
        return;
      }

      setSearchParams({
        ...pick(searchParams, optionsKeys),
        filter: omit(searchParams, optionsKeys),
      });
    },
  };
};
