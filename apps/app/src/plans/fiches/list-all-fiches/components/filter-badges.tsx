import { useFicheActionFilters } from '@/app/plans/fiches/list-all-fiches/filters/fiche-action-filters-context';
import { formatToPrintableFilters } from '@/app/plans/fiches/list-all-fiches/filters/format-to-printable-filters';
import { BadgeFilters } from '@tet/ui';
import { JSX } from 'react';

export const FilterBadges = (): JSX.Element | null => {
  const {
    filters,
    readonlyFilters,
    resetFilters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    getFilterValuesLabels,
  } = useFicheActionFilters();

  const formattedFilterCategories = formatToPrintableFilters(
    filters,
    readonlyFilters,
    getFilterValuesLabels
  );

  if (formattedFilterCategories.length === 0) {
    return null;
  }

  return (
    <BadgeFilters
      filterCategories={formattedFilterCategories}
      onDeleteFilterValue={onDeleteFilterValue}
      onDeleteFilterCategory={onDeleteFilterCategory}
      onClearAllFilters={resetFilters}
    />
  );
};
