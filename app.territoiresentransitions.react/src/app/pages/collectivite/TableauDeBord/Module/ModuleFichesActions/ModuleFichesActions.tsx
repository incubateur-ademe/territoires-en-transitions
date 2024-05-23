import {useHistory} from 'react-router-dom';

import {Button, Modal} from '@tet/ui';

import {TDBViewParam, makeTableauBordModuleUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import Module from '../Module';
import {TDBModuleFichesActions} from '../data';
import {useQuery} from 'react-query';
import {FicheActions} from '@tet/api';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {Filter} from '@tet/api/dist/src/ficheActions';

type Props = {
  view: TDBViewParam;
  module: TDBModuleFichesActions;
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
  // const data = [1, 2, 3, 4, 5, 6];

  const filter: Filter = {
    planActionIds: [1],
    servicePiloteIds: [],
    structurePiloteIds: [1],
    personnePiloteIds: [],
    userPiloteIds: [],
  };

  const {data: result} = useQuery(
    ['TDB_module_fiche_action_1', collectiviteId, view, filter],
    async () => {
      if (!collectiviteId) return [];

      const {data, error} = await FicheActions.fetchFilteredFicheActions({
        dbClient: supabaseClient,
        collectiviteId,
        filter,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    DISABLE_AUTO_REFETCH
  );

  const data = result || [];

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
      {data.map((item, index) => (
        <div className="pb-10">
          <code key={index}>{JSON.stringify(item)}</code>
        </div>
      ))}
    </Module>
  );
};

export default ModuleFichesActions;
