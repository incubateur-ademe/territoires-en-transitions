import type { ListDefinitionsInputFilters } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { areIndicateurVueFiltersEqual } from '@/app/indicateurs/vues/indicateur-vue-filters.rules';

/** Hide fixed-tab criteria only while their current values remain equivalent. */
export function getIndicateurBadgeFilters(
  filters: ListDefinitionsInputFilters,
  defaultFilters: ListDefinitionsInputFilters = {}
): ListDefinitionsInputFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) =>
        !(key in defaultFilters) ||
        !areIndicateurVueFiltersEqual(
          { [key]: value },
          { [key]: defaultFilters[key as keyof ListDefinitionsInputFilters] }
        )
    )
  );
}
