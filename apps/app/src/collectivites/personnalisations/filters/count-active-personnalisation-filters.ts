import { isNil } from 'es-toolkit';
import type { PersonnalisationFilters } from './personnalisation-filters.types';

const isActiveFilter = ([, value]: [string, unknown]): boolean => {
  if (isNil(value)) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
};

export const countActivePersonnalisationFilters = (
  filters: PersonnalisationFilters
): number => {
  return Object.entries(filters).filter(isActiveFilter).length;
};

const MENU_CONTROLLABLE_KEYS: (keyof PersonnalisationFilters)[] = [
  'thematiqueIds',
  'referentielIds',
];

/** compteur pour le menu « Filtrer » (sans actionIds passé uniquement en URL) */
export const countActivePersonnalisationFiltersForMenu = (
  filters: PersonnalisationFilters
): number => {
  return MENU_CONTROLLABLE_KEYS.filter((key) =>
    isActiveFilter([key, filters[key]])
  ).length;
};
