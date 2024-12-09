import classNames from 'classnames';

import { Badge } from '@tet/ui';

type Props = {
  /** valeurs des badges à afficher */
  badges?: string[];
  className?: string;
  resetFilters?: () => void;
};

/** Liste de badges représentant les filtres actifs avec
 * bouton de réinitialisation de ces filtres. */
const FilterBadges = ({ className, badges, resetFilters }: Props) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <div className={classNames('flex flex-wrap gap-x-4 gap-y-2', className)}>
      {badges.map((filter, i) => (
        <Badge key={i} title={filter} state="standard" size="sm" trim={false} />
      ))}
      {resetFilters && (
        <button onClick={resetFilters}>
          <Badge
            icon="delete-bin-6-line"
            iconPosition="left"
            title="Supprimer tous les filtres"
            state="default"
            size="sm"
          />
        </button>
      )}
    </div>
  );
};

export default FilterBadges;
