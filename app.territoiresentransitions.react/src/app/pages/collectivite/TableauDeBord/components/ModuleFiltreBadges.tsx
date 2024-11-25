import { Filtre as FiltrePersonnel } from '@tet/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { Filter as FiltreCollectivite } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';
import { Badge } from '@tet/ui';
import classNames from 'classnames';
import { useFiltreValues } from './useFiltreValues';
import { filtersToBadges } from './utils';

type Props = {
  filtre: FiltrePersonnel | FiltreCollectivite;
  className?: string;
  resetFilters?: () => void;
};

export const useSelectedFilters = ({ filtre }: Pick<Props, 'filtre'>) => {
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

  return selectedFilters;
};

export const ModuleFiltreBadgesBase = (
  props: Pick<Props, 'className' | 'resetFilters'> & {
    selectedFilters: string[];
  }
) => {
  const { className, selectedFilters, resetFilters } = props;

  return (
    <div className={classNames('flex flex-wrap gap-x-4 gap-y-2', className)}>
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

const ModuleFiltreBadges = (props: Props) => {
  const selectedFilters = useSelectedFilters(props);

  return selectedFilters?.length ? (
    <ModuleFiltreBadgesBase {...props} selectedFilters={selectedFilters} />
  ) : null;
};

export default ModuleFiltreBadges;
