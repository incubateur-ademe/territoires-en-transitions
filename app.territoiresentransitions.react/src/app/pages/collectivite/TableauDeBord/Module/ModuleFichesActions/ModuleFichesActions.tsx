import { useHistory } from 'react-router-dom';

import { Button } from '@tet/ui';

import { ModuleFicheActionsSelect } from '@tet/api/collectivites/tableau_de_bord.show/domain/module.schema';
import FicheActionCard from 'app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { useFicheResumesFetch } from 'app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';
import {
  TDBViewParam,
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
  makeTableauBordModuleUrl,
} from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';
import PictoExpert from 'ui/pictogrammes/PictoExpert';
import Module from '../Module';
import ModalActionsDontJeSuisLePilote from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsDontJeSuisLePilote';
import { getQueryKey } from 'app/pages/collectivite/TableauDeBord/Module/useModulesFetch';
import { useAuth } from 'core-logic/api/auth/AuthProvider';
import ModalActionsRecemmentModifiees from 'app/pages/collectivite/TableauDeBord/Module/ModuleFichesActions/ModalActionsRecemmentModifiees';

type Props = {
  view: TDBViewParam;
  module: ModuleFicheActionsSelect;
};

const SLUG_TO_TRACKING_ID = {
  'actions-dont-je-suis-pilote': 'actions_pilotes',
  'actions-recemment-modifiees': 'actions_modifiees',
} as const;

/** Module pour les différents modules liés aux fiches action
 * dans la page tableau de bord plans d'action */
const ModuleFichesActions = ({ view, module }: Props) => {
  const collectiviteId = useCollectiviteId();
  const userId = useAuth().user?.id;
  const history = useHistory();

  const { data, isLoading } = useFicheResumesFetch({
    options: module.options,
  });

  const fiches = data?.data || [];
  const totalCount = data?.count || 0;

  return (
    <Module
      title={module.titre}
      filtre={module.options.filtre}
      symbole={<PictoExpert />}
      trackingId={
        SLUG_TO_TRACKING_ID[module.slug as keyof typeof SLUG_TO_TRACKING_ID]
      }
      editModal={(openState) => {
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
      isEmpty={fiches.length === 0}
      footerButtons={
        totalCount > 4 && (
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
            {totalCount === 5
              ? '1 autre action'
              : `les ${totalCount - 4} autres actions`}
          </Button>
        )
      }
    >
      <div className="grid md:grid-cols-2 2xl:grid-cols-4 gap-4">
        {fiches.map(
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
                    : makeCollectiviteFicheNonClasseeUrl({
                        collectiviteId: collectiviteId!,
                        ficheUid: fiche.id.toString(),
                      })
                }
              />
            )
        )}
      </div>
    </Module>
  );
};

export default ModuleFichesActions;
