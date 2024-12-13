import { useState } from 'react';

import { TrackPageView, useEventTracker } from '@/ui';

import {
  ModulePlanActionListSelect,
  Slug,
} from '@/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';
import PlansActionListe from '@/app/app/pages/collectivite/PlansActions/PlanAction/list/PlansActionListe';
import { useCollectiviteModuleFetch } from '@/app/app/pages/collectivite/TableauDeBord/Collectivite/useColectiviteModuleFetch';
import { ModuleDisplay } from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import ModulePage from '@/app/app/pages/collectivite/TableauDeBord/components/ModulePage';
import { TDBViewParam } from '@/app/app/paths';

type Props = {
  view: TDBViewParam;
  slug: Slug;
};

/** Page du module suivi des plans d'action de la collectivité */
const ModuleSuiviPlansActionPage = ({ view, slug }: Props) => {
  const trackEvent = useEventTracker('app/tdb/collectivite/suivi-plan-actions');

  const { data: dataModule, isLoading: isModuleLoading } =
    useCollectiviteModuleFetch(slug);

  const module = dataModule as ModulePlanActionListSelect;

  const [display, setDisplay] = useState<ModuleDisplay>('row');

  if (isModuleLoading || !module) {
    return null;
  }

  return (
    <ModulePage view={view} title={module.titre}>
      <TrackPageView
        pageName={`app/tdb/collectivite/${slug}`}
        properties={{ collectivite_id: module.collectiviteId }}
      />
      <PlansActionListe
        filtres={module.options.filtre ?? {}}
        displaySettings={{ display, setDisplay }}
        // settings={collectivite?.niveau_acces === 'admin' ? (openState) => (
        //   <>
        //     <Button
        //       variant="outlined"
        //       icon="equalizer-line"
        //       size="sm"
        //       children="Filtrer"
        //       onClick={() => {
        //         openState.setIsOpen(true);
        //         trackEvent('tdb_modifier_filtres_suivi_plan_actions', {
        //           collectivite_id: module.collectiviteId,
        //         });
        //       }}
        //     />
        //     <ModalSuiviPlansAction
        //       module={module}
        //       openState={openState}
        //       displaySettings={{ display, setDisplay }}
        //       keysToInvalidate={[getQueryKey(slug)]}
        //     />
        //   </>
        // ) : undefined}
      />
    </ModulePage>
  );
};

export default ModuleSuiviPlansActionPage;
