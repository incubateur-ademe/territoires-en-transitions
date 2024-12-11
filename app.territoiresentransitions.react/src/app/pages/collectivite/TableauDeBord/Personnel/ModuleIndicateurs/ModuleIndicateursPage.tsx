import { Button, TrackPageView, useEventTracker } from '@/ui';

import {
  ModuleIndicateursSelect,
  Slug,
} from '@/api/plan-actions/dashboards/personal-dashboard/domain/module.schema';
import IndicateursListe from '@tet/app/pages/collectivite/Indicateurs/lists/indicateurs-list';
import { usePlanActionsCount } from '@tet/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionsCount';
import ModulePage from '@tet/app/pages/collectivite/TableauDeBord/components/ModulePage';
import ModalIndicateursSuiviPlan from '@tet/app/pages/collectivite/TableauDeBord/Personnel/ModuleIndicateurs/ModalIndicateursSuiviPlan';
import {
  getQueryKey,
  usePersonalModuleFetch,
} from '@tet/app/pages/collectivite/TableauDeBord/Personnel/usePersonalModuleFetch';
import { TDBViewParam } from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';

type Props = {
  view: TDBViewParam;
  slug: Slug;
};

const ModuleIndicateursPage = ({ view, slug }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { data: module, isLoading: isModuleLoading } =
    usePersonalModuleFetch(slug);

  const filtre = module?.options.filtre;

  const { count } = usePlanActionsCount();

  const pageName = 'app/tdb/personnel/indicateurs-de-suivi-de-mes-plans';
  const trackEvent = useEventTracker(pageName);

  if (isModuleLoading || !module) {
    return null;
  }

  return (
    <ModulePage view={view} title={module.titre}>
      <TrackPageView
        pageName={`app/tdb/personnel/${slug}`}
        properties={{ collectivite_id: collectiviteId! }}
      />
      <IndicateursListe
        pageName={pageName}
        filtres={filtre}
        customFilterBadges={{
          planActions:
            filtre?.planActionIds?.length === count && 'Tous les plans',
        }}
        settings={(openState) => (
          <>
            <Button
              variant="outlined"
              icon="equalizer-line"
              size="sm"
              onClick={() => {
                openState.setIsOpen(true);
                trackEvent('tdb_modifier_filtres_indicateurs', {
                  collectivite_id: collectiviteId!,
                });
              }}
            >
              Filtrer
            </Button>
            {openState.isOpen && (
              <ModalIndicateursSuiviPlan
                openState={openState}
                module={module as ModuleIndicateursSelect}
                keysToInvalidate={[getQueryKey(slug)]}
              />
            )}
          </>
        )}
      />
    </ModulePage>
  );
};

export default ModuleIndicateursPage;
