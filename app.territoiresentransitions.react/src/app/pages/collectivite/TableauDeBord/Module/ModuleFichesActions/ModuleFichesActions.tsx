import {useHistory} from 'react-router-dom';

import {Button, Modal} from '@tet/ui';

import {filtreValuesFetch} from '@tet/api/dist/src/collectivites/shared/actions/filtre_values.fetch';
import {ficheActionResumesFetch} from '@tet/api/src/fiche_actions/resumes.list/actions/fiche_action_resumes.fetch';
import {FetchOptions} from '@tet/api/src/fiche_actions/resumes.list/domain/fetch_options.schema';
import {TDBViewParam, makeTableauBordModuleUrl} from 'app/paths';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useQuery} from 'react-query';
import Module from '../Module';
import {TDBModuleFichesActions} from '../data';

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

  const options: FetchOptions = {
    filtre: {
      planActionIds: [],
      servicePiloteIds: [],
      structurePiloteIds: [],
      personnePiloteIds: [],
      utilisateurPiloteIds: [],
    },
    sort: [
      {
        field: 'modified_at',
        direction: 'desc',
      },
      {
        field: 'titre',
        direction: 'desc',
      },
    ],
    page: 1,
    limit: 3,
  };

  const {data} = useQuery(
    ['TDB_module_fiche_action_1', collectiviteId, view, options],
    async () => {
      if (!collectiviteId) return {};

      const [{data: filtreValues}, {data}] = await Promise.all([
        filtreValuesFetch({
          dbClient: supabaseClient,
          collectiviteId,
          filtre: options.filtre,
        }),

        ficheActionResumesFetch({
          dbClient: supabaseClient,
          collectiviteId,
          options,
        }),
      ]);

      return {filtreValues, data};
    }
  );

  if (!data?.data || !data?.filtreValues) {
    return null;
  }

  const {data: ficheActions, filtreValues} = data;

  return (
    <Module
      title={module.title}
      symbole={module.symbole}
      editModal={openState => (
        <Modal openState={openState} render={() => <div>Filtres</div>} />
      )}
      isLoading={loading}
      isEmpty={isEmpty}
      selectedFilters={filtreValues}
      footerButtons={
        ficheActions.length > 4 && (
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
            {ficheActions.length === 5
              ? '1 autre action'
              : `les ${ficheActions.length - 4} autres actions`}
          </Button>
        )
      }
    >
      {/* À modifier pour afficher les actions */}
      {ficheActions.map((item, index) => (
        <div className="pb-10">
          <code key={index}>{JSON.stringify(item)}</code>
        </div>
      ))}
    </Module>
  );
};

export default ModuleFichesActions;
