import { ListFichesRequestFilters as Filtres } from '@/domain/plans/fiches';
import { filterLabels } from './labels';

/**
 * Count active filters for fiche action filters
 * Excludes noPlan which is set based on the type (classifiees/non-classifiees)
 */
export const countActiveFicheActionFilters = (filters: Filtres): number => {
  const filterKeys = Object.keys(filterLabels) as (keyof Filtres)[];

  const activeFilters = filterKeys.filter((key) => {
    const value = filters[key];
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
