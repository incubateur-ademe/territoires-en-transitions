import { Filtre } from '@tet/api/collectivites/tableau_de_bord.show/domain/module.schema';
import { Badge } from '@tet/ui';
import classNames from 'classnames';
import { useFiltreValues } from './useFiltreValues';
import { filtersToBadges } from './utils';

type Props = {
  filtre: Filtre;
  className?: string;
  resetFilters?: () => void;
};

const ModuleFiltreBadges = ({ filtre, className, resetFilters }: Props) => {
  const { data: filtreValues } = useFiltreValues({
    filtre,
  });

  if (!filtreValues) {
    return null;
  }

  const selectedFilters = filtersToBadges({ ...filtreValues, ...filtre });

  if (selectedFilters.length === 0) {
    return null;
  }

  return (
    <div className={classNames('flex flex-wrap gap-4', className)}>
      {selectedFilters.map((filter) => (
        <Badge
          key={filter}
          title={filter}
          state="standard"
          size="sm"
          trim={false}
        />
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

export default ModuleFiltreBadges;
