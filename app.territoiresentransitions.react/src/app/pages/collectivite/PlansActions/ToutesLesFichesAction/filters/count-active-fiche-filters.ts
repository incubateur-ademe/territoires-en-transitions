import { FilterKeys, FormFilters } from './types';

export const filterKeysToIgnore: FilterKeys[] = ['noPlan'];

/**
 * Filter keys that should be counted as a single category
 * These are grouped together in the UI as one filter category
 */
const combinedFilterKeys: Record<string, FilterKeys[]> = {
  pilotes: ['utilisateurPiloteIds', 'personnePiloteIds'],
  referents: ['utilisateurReferentIds', 'personneReferenteIds'],
  period: ['typePeriode', 'debutPeriode', 'finPeriode'],
};

const isActiveFilter = ([key, value]: [string, any]): boolean => {
  if (filterKeysToIgnore.includes(key as FilterKeys)) {
    return false;
  }
  if (value === undefined || value === null) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
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

export const countActiveFicheFilters = (filters: FormFilters): number => {
  const activeFilters = Object.entries(filters).filter(isActiveFilter);

  const combinedCategories = new Set(
    activeFilters
      .map(([key]) => getCombinedCategoryForKey(key as FilterKeys))
      .filter((category): category is string => category !== null)
  );

  const individualFiltersCount = activeFilters.filter(([key]) =>
    isIndividualFilter(key as FilterKeys)
  ).length;

  return individualFiltersCount + combinedCategories.size;
};
