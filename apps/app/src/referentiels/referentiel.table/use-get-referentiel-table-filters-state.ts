'use client';

import {
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';

const referentielFiltersBaseParsers = {
  identifiantAndTitre: parseAsString,
  explication: parseAsString,
  statuts: parseAsArrayOf(parseAsString),
  pilotes: parseAsArrayOf(parseAsString),
  services: parseAsArrayOf(parseAsInteger),
  categories: parseAsArrayOf(parseAsString),
  scoreRealise: parseAsArrayOf(parseAsString),
  scoreProgramme: parseAsArrayOf(parseAsString),
  scorePasFait: parseAsArrayOf(parseAsString),
};

export const referentielFiltersParsers = {
  identifiantAndTitre:
    referentielFiltersBaseParsers.identifiantAndTitre.withDefault(''),
  explication: referentielFiltersBaseParsers.explication.withDefault(''),
  statuts: referentielFiltersBaseParsers.statuts.withDefault([]),
  pilotes: referentielFiltersBaseParsers.pilotes.withDefault([]),
  services: referentielFiltersBaseParsers.services.withDefault([]),
  categories: referentielFiltersBaseParsers.categories.withDefault([]),
  scoreRealise: referentielFiltersBaseParsers.scoreRealise.withDefault([]),
  scoreProgramme: referentielFiltersBaseParsers.scoreProgramme.withDefault([]),
  scorePasFait: referentielFiltersBaseParsers.scorePasFait.withDefault([]),
};

export const referentielFiltersUrlKeys = {
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

export const referentielFiltersSerializer = createSerializer(
  referentielFiltersBaseParsers,
  { urlKeys: referentielFiltersUrlKeys }
);

export function useGetReferentielTableFiltersState() {
  const [filters, setFilters] = useQueryStates(referentielFiltersParsers, {
    urlKeys: referentielFiltersUrlKeys,
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

export type ReferentielTableFiltersState = ReturnType<
  typeof useGetReferentielTableFiltersState
>;

export type ReferentielTableFilters = Partial<
  ReferentielTableFiltersState['filters']
>;
