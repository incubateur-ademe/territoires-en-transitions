import { FilterCategory, FilterBadges as UIFilterBadges } from '@/ui';

import { filterKeysToIgnore } from './filters/count-active-fiche-filters';
import { useFicheActionFilters } from './filters/fiche-action-filters.context';
import { getFilterLabel, typePeriodLabels } from './filters/labels';
import { type FilterKeys, type Filters } from './filters/types';

const createDateFilterLabel = (filters: Filters): string | null => {
  if (!filters.typePeriode || (!filters.debutPeriode && !filters.finPeriode)) {
    return null;
  }

  const typePeriodeLabel =
    typePeriodLabels[filters.typePeriode as keyof typeof typePeriodLabels] ??
    typePeriodLabels.creation;
  let title = `Date ${typePeriodeLabel}`;

  if (filters.debutPeriode && filters.finPeriode) {
    return `${title} entre le ${new Date(
      filters.debutPeriode
    ).toLocaleDateString()} et le ${new Date(
      filters.finPeriode
    ).toLocaleDateString()}`;
  }

  if (filters.debutPeriode) {
    return `${title} à partir du ${new Date(
      filters.debutPeriode
    ).toLocaleDateString()}`;
  }

  if (filters.finPeriode) {
    return `${title} allant jusqu'au ${new Date(
      filters.finPeriode
    ).toLocaleDateString()}`;
  }

  return title;
};

/**
 * List of filter keys that are displayed as a category only in the filter badges
 */
const filterKeyCategoryVisibility: Partial<Record<FilterKeys, boolean>> = {
  texteNomOuDescription: true,
  noPilote: true,
  hasBudgetPrevisionnel: true,
  hasIndicateurLies: true,
  hasMesuresLiees: true,
  ameliorationContinue: true,
  restreint: false,
  noServicePilote: true,
  noStatut: true,
  noPriorite: true,
  noReferent: true,
};

const createDateFilterContent = (
  filters: Filters
): {
  dateFilterCategory: FilterCategory<FilterKeys> | null;
  remainingFilters: Filters;
} => {
  const dateFilterLabel = createDateFilterLabel(filters);
  if (!dateFilterLabel) {
    return { dateFilterCategory: null, remainingFilters: filters };
  }

  const periodRelatedKeys: FilterKeys[] = [
    'typePeriode',
    'debutPeriode',
    'finPeriode',
  ];

  // Create a new filters object without the date-related keys
  const remainingFilters = { ...filters };
  periodRelatedKeys.forEach((key) => {
    delete remainingFilters[key];
  });

  return {
    dateFilterCategory: {
      key: periodRelatedKeys,
      title: dateFilterLabel,
      selectedFilters: [],
      onlyShowCategory: true,
    },
    remainingFilters,
  };
};

export const FilterBadges = () => {
  const {
    filters,
    resetFilters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    getFilterValuesLabels,
  } = useFicheActionFilters();

  const { dateFilterCategory, remainingFilters } =
    createDateFilterContent(filters);

  const filterCategories: FilterCategory<FilterKeys>[] = Object.entries(
    remainingFilters
  )
    .filter(([key, value]) => {
      if (filterKeysToIgnore.includes(key as FilterKeys)) {
        return false;
      }
      return value !== undefined;
    })
    .map(([key, value]) => {
      const currentKey: FilterKeys = key as FilterKeys;
      const filterValueLabels = getFilterValuesLabels(
        currentKey,
        Array.isArray(value) ? value : []
      );
      return {
        key: key as FilterKeys,
        title: getFilterLabel(currentKey),
        selectedFilters: filterValueLabels,
        onlyShowCategory: filterKeyCategoryVisibility[currentKey],
      };
    });

  const formattedFilterCategories = dateFilterCategory
    ? [...filterCategories, dateFilterCategory]
    : filterCategories;
  return (
    <UIFilterBadges
      filterCategories={formattedFilterCategories}
      onDeleteFilterValue={onDeleteFilterValue}
      onDeleteFilterCategory={onDeleteFilterCategory}
      onClearAllFilters={resetFilters}
    />
  );
};
