import {
  areIndicateurVueFiltersEqual as areDomainIndicateurVueFiltersEqual,
  type ListIndicateursInputFilters,
  listIndicateursInputFiltersSchema,
  normalizeIndicateurVueFilters as normalizeDomainIndicateurVueFilters,
} from '@tet/domain/indicateurs';

// List state can contain extra fields; strip them before strict domain validation.
export function normalizeIndicateurVueFilters(
  filters: ListIndicateursInputFilters
): ListIndicateursInputFilters {
  return normalizeDomainIndicateurVueFilters(
    listIndicateursInputFiltersSchema.parse(filters)
  );
}

export function areIndicateurVueFiltersEqual(
  first: ListIndicateursInputFilters,
  second: ListIndicateursInputFilters
) {
  return areDomainIndicateurVueFiltersEqual(
    listIndicateursInputFiltersSchema.parse(first),
    listIndicateursInputFiltersSchema.parse(second)
  );
}
