import { useFicheActionFilters } from '@/app/plans/fiches/list-all-fiches/filters/fiche-action-filters-context';
import { formatToPrintableFilters } from '@/app/plans/fiches/list-all-fiches/filters/format-to-printable-filters';
import { FilterBadges as UIFilterBadges } from '@/ui';

export const FilterBadges = (): JSX.Element | null => {
  const {
    filters,
    resetFilters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    getFilterValuesLabels,
  } = useFicheActionFilters();

  const formattedFilterCategories = formatToPrintableFilters(
    filters,
    getFilterValuesLabels
  );

  if (formattedFilterCategories.length === 0) {
    return null;
  }

  return (
    <UIFilterBadges
      filterCategories={formattedFilterCategories}
      onDeleteFilterValue={onDeleteFilterValue}
      onDeleteFilterCategory={onDeleteFilterCategory}
      onClearAllFilters={resetFilters}
    />
  );
};
