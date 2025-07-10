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

export const countActiveFicheFilters = (filters: FormFilters): number => {
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

  // Count combined filter categories as one
  const combinedCategories = new Set<string>();

  activeFilters.forEach(([key]) => {
    // Check if this key belongs to a combined category
    for (const [categoryName, keys] of Object.entries(combinedFilterKeys)) {
      if (keys.includes(key as FilterKeys)) {
        combinedCategories.add(categoryName);
        break;
      }
    }
  });

  // Calculate final count: individual filters + combined categories
  const individualFilters = activeFilters.filter(([key]) => {
    // Exclude keys that are part of combined categories
    for (const keys of Object.values(combinedFilterKeys)) {
      if (keys.includes(key as FilterKeys)) {
        return false;
      }
    }
    return true;
  });

  return individualFilters.length + combinedCategories.size;
};
