import { useState } from 'react';

import { Button, TrackPageView, useEventTracker } from '@tet/ui';

import { TDBViewParam } from 'app/paths';
import ModulePage from '../ModulePage';
import PlansActionListe from '@tet/app/pages/collectivite/PlansActions/PlanAction/list/PlansActionListe';
import ModalSuiviPlansAction from '@tet/app/pages/collectivite/TableauDeBord/Module/ModuleSuiviPlansAction/ModalSuiviPlansAction';
import { ModuleDisplay } from '@tet/app/pages/collectivite/TableauDeBord/Module/Module';
import {
  getQueryKey,
  useCollectiviteModuleFetch,
} from '@tet/app/pages/collectivite/TableauDeBord/Module/useColectiviteModuleFetch';
import {
  ModulePlanActionListSelect,
  Slug,
} from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';

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
        filtres={module.options.filtre}
        displaySettings={{ display, setDisplay }}
        // settings={(openState) => (
        //   <>
        //     <Button
        //       variant="outlined"
        //       icon="equalizer-line"
        //       size="sm"
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
        // )}
      />
    </ModulePage>
  );
};

export default ModuleSuiviPlansActionPage;
