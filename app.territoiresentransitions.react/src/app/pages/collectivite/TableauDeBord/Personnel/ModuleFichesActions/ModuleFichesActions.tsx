import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { useUser } from '@/api/users/user-provider';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';
import Module from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import ModalActionsDontJeSuisLePilote from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleFichesActions/ModalActionsDontJeSuisLePilote';
import ModalActionsRecemmentModifiees from '@/app/app/pages/collectivite/TableauDeBord/Personnel/ModuleFichesActions/ModalActionsRecemmentModifiees';
import { getQueryKey } from '@/app/app/pages/collectivite/TableauDeBord/Personnel/usePersonalModulesFetch';
import {
  TDBViewParam,
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
  makeTableauBordModuleUrl,
} from '@/app/app/paths';
import { Button, useEventTracker } from '@/ui';

import { useCurrentCollectivite } from '@/api/collectivites';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import { useRouter } from 'next/navigation';

type Props = {
  view: TDBViewParam;
  module: ModuleFicheActionsSelect;
};

const DEFAULT_MODULE_KEY_TO_TRACKING_ID = {
  'actions-dont-je-suis-pilote': 'actions_pilotes',
  'actions-recemment-modifiees': 'actions_modifiees',
} as const;

/** Module pour afficher des fiches action
 ** dans la page tableau de bord plans d'action */
const ModuleFichesActions = ({ view, module }: Props) => {
  const { collectiviteId } = useCurrentCollectivite()!;
  const userId = useUser().id;
  const router = useRouter();

  const trackEvent = useEventTracker();

  const getSort = () => {
    if (module.defaultKey === 'actions-dont-je-suis-pilote') {
      return [{ field: 'titre' as const, direction: 'asc' as const }];
    }
    return [{ field: 'modified_at' as const, direction: 'desc' as const }];
  };

  const { data, isLoading } = useListFicheResumes({
    filters: {
      ...module.options.filtre,
    },
    queryOptions: {
      sort: getSort(),
    },
  });

  const fiches = data?.data || [];
  const totalCount = data?.count || 0;

  return (
    <Module
      title={module.titre}
      filtre={module.options.filtre}
      symbole={<PictoExpert />}
      onSettingsClick={() =>
        trackEvent(
          `tdb_modifier_filtres_${
            DEFAULT_MODULE_KEY_TO_TRACKING_ID[
              module.defaultKey as keyof typeof DEFAULT_MODULE_KEY_TO_TRACKING_ID
            ]
          }`
        )
      }
      editModal={(openState) => {
        if (module.defaultKey === 'actions-dont-je-suis-pilote') {
          return (
            <ModalActionsDontJeSuisLePilote
              openState={openState}
              module={module}
              keysToInvalidate={[getQueryKey(collectiviteId, userId)]}
            />
          );
        }
        if (module.defaultKey === 'actions-recemment-modifiees') {
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
              router.push(
                makeTableauBordModuleUrl({
                  collectiviteId,
                  view,
                  module: module.defaultKey,
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
                        collectiviteId,
                        ficheUid: fiche.id.toString(),
                        planActionUid: fiche.plans[0].id.toString(),
                      })
                    : makeCollectiviteFicheNonClasseeUrl({
                        collectiviteId,
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
