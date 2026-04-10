import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';

export const referentielFiltersParsers = {
  text: parseAsString.withDefault(''),
  statuts: parseAsArrayOf(parseAsString).withDefault([]),
  pilotes: parseAsArrayOf(parseAsString).withDefault([]),
  services: parseAsArrayOf(parseAsInteger).withDefault([]),
};

const filtersUrlKeys = {
  text: 'q',
  statuts: 's',
  pilotes: 'p',
  services: 'sv',
} as const;

export type ReferentielFilters = {
  text: string;
  statuts: string[];
  pilotes: string[];
  services: number[];
};

export function useGetReferentielTableFiltersState() {
  const [filters, setFilters] = useQueryStates(referentielFiltersParsers, {
    urlKeys: filtersUrlKeys,
    history: 'replace',
  });

  const hasActiveFilters =
    filters.text !== '' ||
    filters.statuts.length > 0 ||
    filters.pilotes.length > 0 ||
    filters.services.length > 0;

  return { filters, setFilters, hasActiveFilters };
}
