import { DeleteFiltersButton } from '@/app/ui/lists/DEPRECATED_filter-badges/delete-filters.button';
import { DEPRECATED_BadgesContainer } from '@tet/ui';

type Props = {
  /** valeurs des badges à afficher */
  badges?: string[];
  className?: string;
  maxDisplayedFilterCount?: number;
  resetFilters?: () => void;
};

/** Liste de badges représentant les filtres actifs avec
 * bouton de réinitialisation de ces filtres. */
const DEPRECATED_FilterBadges = ({
  className,
  badges,
  maxDisplayedFilterCount,
  resetFilters,
}: Props) => {
  return (
    <DEPRECATED_BadgesContainer
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

export default DEPRECATED_FilterBadges;
