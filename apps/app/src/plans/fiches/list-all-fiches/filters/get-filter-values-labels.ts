import { FilterKeys } from './types';
import { LookupConfig } from './use-fiche-action-filters-data';

export const getFilterValuesLabels = (
  lookupConfig: Partial<Record<FilterKeys, LookupConfig>>,
  categoryKey: FilterKeys,
  values: string[] | number[]
): string[] => {
  const config = lookupConfig[categoryKey];
  if (!config) {
    return values.map((value) => value.toString());
  }

  return values.map((value) => {
    const foundItem = config.items?.find(
      (item: Record<string, unknown>) =>
        `${item[config.key]}` === `${value}`
    );
    const rawLabel = foundItem?.[config.valueKey];
    const label =
      typeof rawLabel === 'string'
        ? rawLabel
        : rawLabel != null
          ? String(rawLabel)
          : undefined;
    return label ?? config.fallbackLabel ?? value.toString();
  });
};
