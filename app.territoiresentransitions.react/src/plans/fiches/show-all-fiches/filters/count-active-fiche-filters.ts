import {
  CheckboxFilterKeys,
  filtersByCheckboxProperties,
} from './format-to-printable-filters';
import { isFilterKey, type FilterKeys, type FormFilters } from './types';

export const filterKeysToIgnore: FilterKeys[] = [];

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

export const countActiveFicheFilters = (filters: FormFilters): number => {
  const activeFilters = Object.entries(filters)
    .filter(([key]) => key !== 'noPlan')
    .filter(([key]) => isFilterKey(key))
    .filter(isActiveFilter);

  const individualFiltersCount = countIndividualFilters(activeFilters, filters);
  const combinedCategoriesCount =
    getActiveCombinedCategories(activeFilters).length;

  return individualFiltersCount + combinedCategoriesCount;
};
