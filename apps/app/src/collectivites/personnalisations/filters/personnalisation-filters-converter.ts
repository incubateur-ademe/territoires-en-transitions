import { mapValues } from 'es-toolkit/object';
import { useQueryStates } from 'nuqs';
import type {
  PersonnalisationFilterKeys,
  PersonnalisationFilters,
} from './personnalisation-filters.types';
import { personnalisationFiltersSearchParamsParser } from './personnalisation-search-params-parsers';
import { personnalisationUrlKeys } from './personnalisation-url-keys.constants';

const searchParametersParser = personnalisationFiltersSearchParamsParser;

const emptyFilters = Object.keys(searchParametersParser).reduce((acc, key) => {
  acc[key as PersonnalisationFilterKeys] = null;
  return acc;
}, {} as Record<PersonnalisationFilterKeys, null>);

const parameterMustBeNull = (value: unknown): boolean =>
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

export function usePersonnalisationFiltersFromUrl(): {
  filters: PersonnalisationFilters;
  setFilters: (filters: Partial<PersonnalisationFilters> | null) => void;
} {
  const [filtersFromSearchParams, setSearchParameters] = useQueryStates(
    searchParametersParser,
    { urlKeys: personnalisationUrlKeys }
  );

  const filters = mapValues(filtersFromSearchParams, (value: unknown) => {
    if (value === null) {
      return undefined;
    }
    return value;
  }) as PersonnalisationFilters;

  const setFilters = (newFilters: Partial<PersonnalisationFilters> | null) => {
    const sanitizedFilters = mapValues(newFilters ?? {}, (value: unknown) => {
      if (parameterMustBeNull(value)) {
        return null;
      }
      return value as string[];
    }) as Partial<Record<PersonnalisationFilterKeys, string[] | null>>;
    setSearchParameters({ ...emptyFilters, ...sanitizedFilters });
  };

  return { filters, setFilters };
}
