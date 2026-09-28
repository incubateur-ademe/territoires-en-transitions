import {
  IndicateurVueFilters,
  indicateurVueFiltersSchema,
} from './indicateur-vue-filters.schema';

/** Canonical criteria for persistence and comparison, without changing search text. */
export function normalizeIndicateurVueFilters(
  filters: IndicateurVueFilters
): IndicateurVueFilters {
  const parsedFilters = indicateurVueFiltersSchema.parse(filters);
  const entries = Object.entries(parsedFilters)
    // The list engine ignores empty selections and search; false remains a criterion.
    .filter(
      ([key, value]) =>
        value !== undefined &&
        (key !== 'text' || value !== '') &&
        (!Array.isArray(value) || value.length > 0)
    )
    .sort(([firstKey], [secondKey]) =>
      firstKey < secondKey ? -1 : firstKey > secondKey ? 1 : 0
    )
    .map(([key, value]) => [
      key,
      Array.isArray(value)
        ? [...new Set<string | number>(value)].sort((first, second) =>
            first < second ? -1 : first > second ? 1 : 0
          )
        : value,
    ]);

  return Object.fromEntries(entries) as IndicateurVueFilters;
}

export function areIndicateurVueFiltersEqual(
  first: IndicateurVueFilters,
  second: IndicateurVueFilters
): boolean {
  return (
    JSON.stringify(normalizeIndicateurVueFilters(first)) ===
    JSON.stringify(normalizeIndicateurVueFilters(second))
  );
}
