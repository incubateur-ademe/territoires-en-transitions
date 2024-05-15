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

/** Module pour les différents modules liés aux fiches action
 * dans la page tableau de bord plans d'action */
const ModuleFichesActions = ({view, module}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  /**
   * TODO:
   * - [ ] Récupérer et afficher la liste des actions
   */

  const loading = false;
  const isEmpty = false;
  const data = [1, 2, 3, 4, 5, 6];

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
      footerButtons={
        data.length > 4 && (
          <Button
            variant="grey"
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
            Afficher{' '}
            {data.length === 5
              ? '1 autre action'
              : `les ${data.length - 4} autres actions`}
          </Button>
        )
      }
    >
      Contenu du module
    </Module>
  );
};

export default ModuleFichesActions;
