import {useHistory} from 'react-router-dom';

import {Button} from '@tet/ui';

import {ModuleFicheActionsSelect} from '@tet/api/dist/src/collectivites/tableau_de_bord.show/domain/module.schema';
import FicheActionCard from 'app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import {useFicheActionResumeFetch} from 'app/pages/collectivite/PlansActions/FicheAction/data/useFicheActionResumeFetch';
import {
  TDBViewParam,
  makeCollectivitePlanActionFicheUrl,
  makeTableauBordModuleUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import PictoExpert from 'ui/pictogrammes/PictoExpert';
import Module from '../Module';
import ModalActionsDontJeSuisLePilote from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsDontJeSuisLePilote';
import {getQueryKey} from 'app/pages/collectivite/TableauDeBord/Module/useModulesFetch';
import {useAuth} from 'core-logic/api/auth/AuthProvider';
import ModalActionsRecemmentModifiees from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsRecemmentModifiees';

type Props = {
  view: TDBViewParam;
  module: ModuleFicheActionsSelect;
};

/** Module pour les différents modules liés aux fiches action
 * dans la page tableau de bord plans d'action */
const ModuleFichesActions = ({view, module}: Props) => {
  const collectiviteId = useCollectiviteId();
  const userId = useAuth().user?.id;
  const history = useHistory();

  const {data, isLoading} = useFicheActionResumeFetch({
    options: module.options,
  });

  const fiches = data?.data;

  return (
    <Module
      title={module.titre}
      filtre={module.options.filtre}
      symbole={<PictoExpert />}
      editModal={openState => {
        if (module.slug === 'actions-dont-je-suis-pilote') {
          return (
            <ModalActionsDontJeSuisLePilote
              openState={openState}
              module={module}
              keysToInvalidate={[getQueryKey(collectiviteId, userId)]}
            />
          );
        }
        if (module.slug === 'actions-recemment-modifiees') {
          return (
            <ModalActionsRecemmentModifiees
              openState={openState}
              module={module}
              keysToInvalidate={[getQueryKey(collectiviteId, userId)]}
            />
          );
        }
      }}
      isLoading={isLoading}
      isEmpty={!fiches || fiches?.length === 0}
      footerButtons={
        fiches &&
        fiches.length > 4 && (
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
            {fiches.length === 5
              ? '1 autre action'
              : `les ${fiches.length - 4} autres actions`}
          </Button>
        )
      }
    >
      <div className="grid md:grid-cols-2 2xl:grid-cols-4 gap-4">
        {fiches &&
          fiches.map(
            (fiche, index) =>
              index < 4 && (
                <FicheActionCard
                  key={fiche.id}
                  ficheAction={fiche}
                  isEditable
                  editKeysToInvalidate={[
                    [
                      'fiches_resume_collectivite',
                      collectiviteId,
                      module.options,
                    ],
                  ]}
                  link={
                    fiche.plans && fiche.plans[0] && fiche.plans[0].id
                      ? makeCollectivitePlanActionFicheUrl({
                          collectiviteId: collectiviteId!,
                          ficheUid: fiche.id!.toString(),
                          planActionUid: fiche.plans[0].id!.toString(),
                        })
                      : undefined
                  }
                />
              )
          )}
      </div>
    </Module>
  );
};

export default ModuleFichesActions;
