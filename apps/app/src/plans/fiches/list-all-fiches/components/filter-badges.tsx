import { removeIdleSousActionsScope } from '@/app/plans/fiches/list-all-fiches/filters/count-active-fiche-filters';
import { useFicheActionFilters } from '@/app/plans/fiches/list-all-fiches/filters/fiche-action-filters-context';
import { formatToPrintableFilters } from '@/app/plans/fiches/list-all-fiches/filters/format-to-printable-filters';
import { BadgeFilters } from '@tet/ui';
import { JSX } from 'react';

type Props = {
  /** Une recherche texte est en cours sur la liste. */
  hasTextSearch: boolean;
};

export const FilterBadges = ({ hasTextSearch }: Props): JSX.Element | null => {
  const {
    filters,
    readonlyFilters,
    resetFilters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    getFilterValuesLabels,
  } = useFicheActionFilters();

  const formattedFilterCategories = formatToPrintableFilters(
    removeIdleSousActionsScope(filters, { hasTextSearch }),
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
