import {useHistory, useParams} from 'react-router-dom';

import {Button} from '@tet/ui';

import {TDBViewParam, makeTableauBordUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TDBModuleTypes} from 'app/pages/collectivite/TableauDeBord/Module/data';

type Props = {
  view: TDBViewParam;
  module: TDBModuleTypes;
};

/** Composant générique de la page d'un module du tableau de bord plans d'action */
const ModulePage = ({view, module}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  const {tdbModule: slug}: {tdbModule: string} = useParams();

  return (
    <div data-test={`tdb-${slug}`}>
      <h2>{module.title}</h2>
      <Button
        variant="underlined"
        className="mt-4"
        size="sm"
        onClick={() =>
          history.push(
            makeTableauBordUrl({
              collectiviteId: collectiviteId!,
              view,
            })
          )
        }
      >
        Revenir au tableau de bord
      </Button>
    </div>
  );
};

export default ModulePage;
