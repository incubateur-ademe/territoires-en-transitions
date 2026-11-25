import { omit } from 'es-toolkit';
import {
  CheckboxFilterKeys,
  filtersByCheckboxProperties,
} from './format-to-printable-filters';
import { FilterKeys, FormFilters, isFilterKey } from './types';

/**
 * Filter keys that should be counted as a single category
 * These are grouped together in the UI as one filter category
 */
const combinedFilterKeys: Record<string, FilterKeys[]> = {
  pilotes: ['utilisateurPiloteIds', 'personnePiloteIds'],
  referents: ['utilisateurReferentIds', 'personneReferenteIds'],
};

const isActiveFilter = ([key, value]: [string, any]): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (
    value ===
    filtersByCheckboxProperties[key as CheckboxFilterKeys]?.defaultValue
  ) {
    return false;
  }

  return true;
};

const getCombinedCategoryForKey = (key: FilterKeys): string | null => {
  const entry = Object.entries(combinedFilterKeys).find(([, keys]) =>
    keys.includes(key)
  );
  return entry ? entry[0] : null;
};

const isIndividualFilter = (key: FilterKeys): boolean =>
  getCombinedCategoryForKey(key) === null;

const isPeriodFilterActive = (filters: FormFilters): boolean => {
  const { typePeriode, debutPeriode, finPeriode } = filters;

  const hasTypePeriode = isActiveFilter(['typePeriode', typePeriode]);
  const hasDebutPeriode = isActiveFilter(['debutPeriode', debutPeriode]);
  const hasFinPeriode = isActiveFilter(['finPeriode', finPeriode]);

  return hasTypePeriode && (hasDebutPeriode || hasFinPeriode);
};

const getActiveCombinedCategories = (
  activeFilters: [string, any][]
): string[] => {
  const combinedCategories = activeFilters
    .map(([key]) => getCombinedCategoryForKey(key as FilterKeys))
    .filter((category): category is string => category !== null);

  return [...new Set(combinedCategories)];
};

const countIndividualFilters = (
  activeFilters: [string, any][],
  filters: FormFilters
): number => {
  const individualFilters = activeFilters.filter(([key]) =>
    isIndividualFilter(key as FilterKeys)
  );

  // Check if period filters should be counted as one
  const periodFiltersCount = isPeriodFilterActive(filters) ? 1 : 0;
  const otherIndividualFiltersCount = individualFilters.filter(([key]) => {
    const filterKey = key as FilterKeys;
    return (
      filterKey !== 'typePeriode' &&
      filterKey !== 'debutPeriode' &&
      filterKey !== 'finPeriode'
    );
  }).length;

  return periodFiltersCount + otherIndividualFiltersCount;
};

/** Le périmètre « Actions et sous-actions » n'est pas un filtre en soi. */
const scopeFilterKeys: FilterKeys[] = ['withSousActionsMatches'];

export const countActiveFicheFilters = (filters: FormFilters): number => {
  const activeFilters = Object.entries(filters)
    .filter(([key]) => isFilterKey(key))
    .filter(([key]) => !scopeFilterKeys.includes(key as FilterKeys))
    .filter(isActiveFilter);

  const individualFiltersCount = countIndividualFilters(activeFilters, filters);
  const combinedCategoriesCount =
    getActiveCombinedCategories(activeFilters).length;

  return individualFiltersCount + combinedCategoriesCount;
};

/**
 * Le périmètre « Sous-actions incluses » ne s'applique qu'aux filtres et à la
 * recherche texte : sans l'un ni l'autre, il est retiré pour ne changer ni les
 * badges ni les résultats.
 */
export const removeIdleSousActionsScope = (
  filters: FormFilters,
  { hasTextSearch }: { hasTextSearch: boolean }
): FormFilters => {
  if (
    !filters.withSousActionsMatches ||
    hasTextSearch ||
    countActiveFicheFilters(filters) > 0
  ) {
    return filters;
  }
  return omit(filters, ['withSousActionsMatches']);
};
