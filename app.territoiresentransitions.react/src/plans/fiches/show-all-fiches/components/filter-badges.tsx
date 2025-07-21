import { formatToPrintableFilters } from '@/app/plans/fiches/show-all-fiches/components/format-to-printable-filters';
import { useFicheActionFilters } from '@/app/plans/fiches/show-all-fiches/filters/fiche-action-filters-context';
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
