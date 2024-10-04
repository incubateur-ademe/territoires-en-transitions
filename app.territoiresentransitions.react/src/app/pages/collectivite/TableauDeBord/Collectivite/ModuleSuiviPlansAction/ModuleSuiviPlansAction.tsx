import { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { ModulePlanActionListSelect } from '@tet/api/plan-actions/dashboards/collectivite-dashboard/domain/module.schema';
import { usePlansActionsListe } from '@tet/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import PlanActionCard from '@tet/app/pages/collectivite/PlansActions/PlanAction/list/card/PlanActionCard';
import { Button, useEventTracker } from '@tet/ui';
import Module, {
  ModuleDisplay,
} from 'app/pages/collectivite/TableauDeBord/components/Module';
import {
  makeCollectivitePlanActionUrl,
  makeTableauBordModuleUrl,
  TDBViewParam,
} from 'app/paths';
import PictoDocument from 'ui/pictogrammes/PictoDocument';
import ModalSuiviPlansAction from '@tet/app/pages/collectivite/TableauDeBord/Collectivite/ModuleSuiviPlansAction/ModalSuiviPlansAction';

type Props = {
  view: TDBViewParam;
  module: ModulePlanActionListSelect;
};

/** Module pour afficher l'avancement des fiches action */
const ModuleSuiviPlansAction = ({ view, module }: Props) => {
  const history = useHistory();

  const trackEvent = useEventTracker('app/tdb/collectivite');

  const { data, isLoading } = usePlansActionsListe({
    withSelect: ['axes'],
  });

  const plansAction = data?.plans;
  const totalCount = plansAction?.length || 0;

  const [display, setDisplay] = useState<ModuleDisplay>('row');

  return (
    <Module
      title={module.titre}
      filtre={module.options.filtre}
      symbole={<PictoDocument className="w-16 h-16" />}
      onSettingsClick={() =>
        trackEvent('tdb_modifier_filtres_suivi_plans', {
          collectivite_id: module.collectiviteId,
        })
      }
      // editModal={(openState) => (
      //   <ModalSuiviPlansAction
      //     module={module}
      //     openState={openState}
      //     displaySettings={{ display, setDisplay }}
      //   />
      // )}
      isLoading={isLoading}
      isEmpty={plansAction?.length === 0}
      displaySettings={{
        display,
        setDisplay,
      }}
      footerButtons={
        totalCount > 3 && (
          <Button
            variant="grey"
            size="sm"
            onClick={() =>
              history.push(
                makeTableauBordModuleUrl({
                  collectiviteId: module.collectiviteId,
                  view,
                  module: module.slug,
                })
              )
            }
          >
            Voir les plans
          </Button>
        )
      }
    >
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {plansAction?.map(
          (plan, index) =>
            index < 3 && (
              <PlanActionCard
                key={plan.id}
                plan={plan}
                display={display}
                link={makeCollectivitePlanActionUrl({
                  collectiviteId: plan.collectiviteId,
                  planActionUid: plan.id.toString(),
                })}
                openInNewTab
              />
            )
        )}
      </div>
    </Module>
  );
};

export default ModuleSuiviPlansAction;
