import { Button, useEventTracker } from '@/ui';

import { ModuleFicheActionsSelect } from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import { SortFichesAction } from '@/api/plan-actions/fiche-resumes.list';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { useFicheResumesFetch } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';
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
import { useAuth } from '@/app/core-logic/api/auth/AuthProvider';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import { useRouter } from 'next/navigation';

type Props = {
  view: TDBViewParam;
  module: ModuleFicheActionsSelect;
};

const SLUG_TO_TRACKING_ID = {
  'actions-dont-je-suis-pilote': 'actions_pilotes',
  'actions-recemment-modifiees': 'actions_modifiees',
} as const;

/** Module pour afficher des fiches action
 ** dans la page tableau de bord plans d'action */
const ModuleFichesActions = ({ view, module }: Props) => {
  const collectiviteId = useCollectiviteId();
  const userId = useAuth().user?.id;
  const router = useRouter();

  const trackEvent = useEventTracker('app/tdb/personnel');

  const getSort = (): SortFichesAction[] => {
    if (module.slug === 'actions-dont-je-suis-pilote') {
      return [{ field: 'titre', direction: 'asc' }];
    }
    return [{ field: 'modified_at', direction: 'desc' }];
  };

  const { data, isLoading } = useFicheResumesFetch({
    options: {
      ...module.options,
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
            SLUG_TO_TRACKING_ID[module.slug as keyof typeof SLUG_TO_TRACKING_ID]
          }`,
          {
            collectivite_id: module.collectiviteId,
          }
        )
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
              router.push(
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
