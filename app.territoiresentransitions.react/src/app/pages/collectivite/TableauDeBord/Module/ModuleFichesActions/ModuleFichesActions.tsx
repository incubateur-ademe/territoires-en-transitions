import {useHistory} from 'react-router-dom';

import {Button, Modal} from '@tet/ui';

import {TDBViewParam, makeTableauBordModuleUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import Module from '../Module';
import {TDBFichesActionsModuleTypes} from '../data';

type Props = {
  view: TDBViewParam;
  module: TDBFichesActionsModuleTypes;
};

/** Module pour la page tableau de bord plans d'action */
const ModuleFichesActions = ({view, module}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  /**
   * TODO:
   * - [ ] Récupérer et afficher la liste des actions
   */

  const loading = false;
  const isEmpty = false;

  return (
    <Module
      title={module.title}
      symbole={module.symbole}
      editModal={openState => (
        <Modal openState={openState} render={() => <div>Filtres</div>} />
      )}
      isLoading={loading}
      isEmpty={isEmpty}
      selectedFilters={['test']}
    >
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

export default ModuleFichesActions;
