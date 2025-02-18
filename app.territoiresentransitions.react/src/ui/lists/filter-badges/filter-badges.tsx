import { DeleteFiltersButton } from '@/app/ui/lists/filter-badges/delete-filters.button';
import { BadgesContainer } from '@/ui';

type Props = {
  /** valeurs des badges à afficher */
  badges?: string[];
  className?: string;
  maxDisplayedFilterCount?: number;
  resetFilters?: () => void;
};

/** Liste de badges représentant les filtres actifs avec
 * bouton de réinitialisation de ces filtres. */
const FilterBadges = ({
  className,
  badges,
  maxDisplayedFilterCount,
  resetFilters,
}: Props) => {
  return (
    <BadgesContainer
      badges={badges}
      className={className}
      badgeProps={{ state: 'standard', size: 'sm', trim: false }}
      maxDisplayedBadge={
        maxDisplayedFilterCount
          ? { count: maxDisplayedFilterCount, label: 'filtre(s)' }
          : undefined
      }
      endButtonBadge={
        resetFilters ? (
          <DeleteFiltersButton onClick={resetFilters} />
        ) : undefined
      }
    />
  );
};

export default FilterBadges;
