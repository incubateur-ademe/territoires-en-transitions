import {useHistory} from 'react-router-dom';

import {Button} from '@tet/ui';

import {TDBViewParam, makeTableauBordModuleUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import Module from '../Module';
import {TDBModuleTypes} from '../data';

type Props = {
  view: TDBViewParam;
  module: TDBModuleTypes;
};

/** Module pour la page tableau de bord plans d'action */
const ActionsDontJeSuisPilote = ({view, module}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  /**
   * TODO:
   * - [ ] Récupérer et afficher la liste des actions
   */

  return (
    <Module title={module.title}>
      <Button
        variant="outlined"
        className="mt-4"
        size="sm"
        onClick={() =>
          history.push(
            makeTableauBordModuleUrl({
              collectiviteId: collectiviteId!,
              view,
              module: module.slug,
            })
          )
        }
      >
        Ouvrir la page du module
      </Button>
    </Module>
  );
};

export default ActionsDontJeSuisPilote;
