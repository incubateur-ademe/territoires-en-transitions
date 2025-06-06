import { useState } from 'react';

import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import PlanActionCard from '@/app/app/pages/collectivite/PlansActions/PlanAction/list/card/PlanActionCard';
import Module, {
  ModuleDisplay,
} from '@/app/app/pages/collectivite/TableauDeBord/components/Module';
import {
  makeCollectivitePlanActionUrl,
  makeTableauBordModuleUrl,
  TDBViewParam,
} from '@/app/app/paths';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { ModulePlanActionListType } from '@/domain/collectivites';
import { Button, Event, useEventTracker } from '@/ui';
import { useRouter } from 'next/navigation';

type Props = {
  view: TDBViewParam;
  module: ModulePlanActionListType;
};

/** Module pour afficher l'avancement des fiches action */
const ModuleSuiviPlansAction = ({ view, module }: Props) => {
  const router = useRouter();

  const trackEvent = useEventTracker();

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
      onSettingsClick={() => trackEvent(Event.tdb.updateFiltresSuiviPlans)}
      // editModal={collectivite?.niveau_acces === 'admin' ? (openState) => (
      //   <ModalSuiviPlansAction
      //     module={module}
      //     openState={openState}
      //     displaySettings={{ display, setDisplay }}
      //   />
      // ) : undefined}
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
              router.push(
                makeTableauBordModuleUrl({
                  collectiviteId: module.collectiviteId,
                  view,
                  module: module.defaultKey!,
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
