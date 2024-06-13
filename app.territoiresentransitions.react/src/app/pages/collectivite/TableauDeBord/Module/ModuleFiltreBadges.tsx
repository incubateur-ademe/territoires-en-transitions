import {Filtre} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {Badge} from '@tet/ui';
import classNames from 'classnames';
import {useFiltreValues} from './useFiltreValues';
import {filtersToBadges} from './utils';

type Props = {
  filtre: Filtre;
  className?: string;
};

const ModuleFiltreBadges = ({filtre, className}: Props) => {
  const {data: filtreValues} = useFiltreValues({
    filtre,
  });

  if (!filtreValues) {
    return null;
  }

  const selectedFilters = filtersToBadges({...filtreValues, ...filtre});

  return (
    <div className={classNames('flex flex-wrap gap-4', className)}>
      {selectedFilters.map(filter => (
        <Badge
          key={filter}
          title={filter}
          state="standard"
          size="sm"
          trim={false}
        />
      ))}
    </div>
  );
};

export default ModuleFiltreBadges;
