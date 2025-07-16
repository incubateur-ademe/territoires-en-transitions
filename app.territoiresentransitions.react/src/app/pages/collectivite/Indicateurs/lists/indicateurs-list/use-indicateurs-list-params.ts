import { indicateursNameToParams } from '@/app/app/pages/collectivite/Indicateurs/lists/utils';
import {
  ListIndicateursRequestFilters,
  listIndicateursRequestFiltersSchema,
} from '@/domain/indicateurs';
import { omit, pick } from 'es-toolkit';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';

export type SortBy = keyof Pick<
  ListIndicateursRequestFilters,
  'estComplet' | 'text'
>;

const sortByValues: SortBy[] = ['estComplet', 'text'] as const;

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

export const sortByCompletude = {
  label: 'Complétude',
  value: 'estComplet',
  direction: 'desc',
} as const;

export const sortByItems: SortByItem[] = [
  sortByCompletude,
  {
    label: 'Ordre alphabétique',
    value: 'text',
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

export type SearchParams = ListIndicateursRequestFilters & ListOptions;
export const searchParamsMap = {
  ...indicateursNameToParams,
  ...optionsNameToParams,
};

/** Gère les paramètres d'une liste d'indicateurs */
export const useIndicateursListParams = (
  defaultFilters: ListIndicateursRequestFilters,
  defaultOptions?: Partial<ListOptions>
) => {
  const [searchParams, setSearchParams] = useQueryStates(
    {
      sortBy: parseAsStringLiteral(sortByValues).withDefault(
        defaultOptions?.sortBy ?? 'estComplet'
      ),
      displayGraphs: parseAsBoolean.withDefault(
        defaultOptions?.displayGraphs ?? true
      ),
      currentPage: parseAsInteger.withDefault(1),

      filter: parseAsJson(
        listIndicateursRequestFiltersSchema.parse
      ).withDefault(defaultFilters),
    },
    {
      urlKeys: searchParamsMap,
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
