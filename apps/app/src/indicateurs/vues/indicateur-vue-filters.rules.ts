import type { ListDefinitionsInputFilters } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import {
  areIndicateurVueFiltersEqual as areDomainIndicateurVueFiltersEqual,
  listDefinitionsInputFiltersSchema,
  normalizeIndicateurVueFilters as normalizeDomainIndicateurVueFilters,
} from '@tet/domain/indicateurs';

// List state can contain extra fields; strip them before strict domain validation.
export function normalizeIndicateurVueFilters(
  filters: ListDefinitionsInputFilters
): ListDefinitionsInputFilters {
  return normalizeDomainIndicateurVueFilters(
    listDefinitionsInputFiltersSchema.parse(filters)
  );
}

export function areIndicateurVueFiltersEqual(
  first: ListDefinitionsInputFilters,
  second: ListDefinitionsInputFilters
) {
  return areDomainIndicateurVueFiltersEqual(
    listDefinitionsInputFiltersSchema.parse(first),
    listDefinitionsInputFiltersSchema.parse(second)
  );
}
