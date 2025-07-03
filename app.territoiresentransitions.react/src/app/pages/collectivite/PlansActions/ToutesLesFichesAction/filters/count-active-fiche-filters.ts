import { FilterKeys, Filters } from './types';

export const filterKeysToIgnore: FilterKeys[] = ['noPlan'];

export const countActiveFicheFilters = (filters: Filters): number => {
  const activeFilters = Object.entries(filters).filter(([key, value]) => {
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
  });

  return activeFilters.length;
};
