import {useHistory} from 'react-router-dom';

import {Button, Modal} from '@tet/ui';

import {ModuleSelect} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import {useFicheActionResumeFetch} from 'app/pages/collectivite/PlansActions/FicheAction/data/useFicheActionResumeFetch';
import {TDBViewParam, makeTableauBordModuleUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import PictoExpert from 'ui/pictogrammes/PictoExpert';
import Module from '../Module';
import {FetchOptions} from '@tet/api/dist/src/fiche_actions/resumes.list/domain/fetch_options.schema';

type Props = {
  view: TDBViewParam;
  module: ModuleSelect;
};

/** Module pour les différents modules liés aux fiches action
 * dans la page tableau de bord plans d'action */
const ModuleFichesActions = ({view, module}: Props) => {
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  const {data: actions, isLoading} = useFicheActionResumeFetch({
    options: module.options as FetchOptions,
  });

  const isEmpty = !actions || actions?.length === 0;

  return (
    <Module
      title={module.titre}
      symbole={<PictoExpert />}
      editModal={openState => (
        <Modal openState={openState} render={() => <div>Filtres</div>} />
      )}
      isLoading={isLoading}
      isEmpty={isEmpty}
      selectedFilters={['test']}
      footerButtons={
        actions &&
        actions.length > 4 && (
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
            {actions.length === 5
              ? '1 autre action'
              : `les ${actions.length - 4} autres actions`}
          </Button>
        )
      }
    >
      {actions &&
        actions.map(action => <div key={action.id}>{action.titre}</div>)}
    </Module>
  );
};

export default ModuleFichesActions;
