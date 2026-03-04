import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';

export const referentielFiltersParsers = {
  identifiantAndTitre: parseAsString.withDefault(''),
  explication: parseAsString.withDefault(''),
  statuts: parseAsArrayOf(parseAsString).withDefault([]),
  pilotes: parseAsArrayOf(parseAsString).withDefault([]),
  services: parseAsArrayOf(parseAsInteger).withDefault([]),
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  scoreRealise: parseAsArrayOf(parseAsString).withDefault([]),
  scoreProgramme: parseAsArrayOf(parseAsString).withDefault([]),
  scorePasFait: parseAsArrayOf(parseAsString).withDefault([]),
};

const filtersUrlKeys = {
  identifiantAndTitre: 't',
  explication: 'e',
  statuts: 's',
  pilotes: 'p',
  services: 'sv',
  categories: 'c',
  scoreRealise: 'sr',
  scoreProgramme: 'sp',
  scorePasFait: 'spf',
} as const;

export type ReferentielFilters = {
  identifiantAndTitre: string;
  explication: string;
  statuts: string[];
  pilotes: string[];
  services: number[];
  categories: string[];
  scoreRealise: string[];
  scoreProgramme: string[];
  scorePasFait: string[];
};

export function useGetReferentielTableFiltersState() {
  const [filters, setFilters] = useQueryStates(referentielFiltersParsers, {
    urlKeys: filtersUrlKeys,
    history: 'replace',
  });

  const hasActiveFilters =
    filters.identifiantAndTitre !== '' ||
    filters.explication !== '' ||
    filters.statuts.length > 0 ||
    filters.pilotes.length > 0 ||
    filters.services.length > 0 ||
    filters.categories.length > 0 ||
    filters.scoreRealise.length > 0 ||
    filters.scoreProgramme.length > 0 ||
    filters.scorePasFait.length > 0;

  return { filters, setFilters, hasActiveFilters };
}
