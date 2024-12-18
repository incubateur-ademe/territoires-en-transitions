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
        resetFilters
          ? {
              title: 'Supprimer tous les filtres',
              onClick: resetFilters,
              props: {
                icon: 'delete-bin-6-line',
                iconPosition: 'left',
                state: 'default',
              },
            }
          : undefined
      }
    />
  );
};

export default FilterBadges;
