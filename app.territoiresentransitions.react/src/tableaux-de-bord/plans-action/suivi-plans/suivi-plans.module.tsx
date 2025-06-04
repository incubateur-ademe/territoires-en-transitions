import { useState } from 'react';

import { useCollectiviteId } from '@/api/collectivites';
import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {
  makeCollectivitePlanActionUrl,
  makeTdbPlansEtActionsModuleUrl,
} from '@/app/app/paths';
import PlanCard, {
  PlanCardDisplay,
} from '@/app/plans-action/plans/card/plan.card';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { ModulePlanActionListType } from '@/domain/collectivites';
import { ButtonGroup } from '@/ui';

type Props = {
  module: ModulePlanActionListType;
};

/** Module pour l'avancement des plans d'action */
const SuiviPlansModule = ({ module }: Props) => {
  const { titre, options, defaultKey } = module;

  const collectiviteId = useCollectiviteId();

  const { data, isLoading, error } = usePlansActionsListe({
    withSelect: ['axes'],
  });

  const plansAction = data?.plans;
  const totalCount = plansAction?.length || 0;

  /** Nb fiches action par statut affiché en donuts ou en ligne */
  const [display, setDisplay] = useState<PlanCardDisplay>('row');

  return (
    <Module
      title={titre}
      filters={options.filtre}
      symbole={<PictoDocument className="w-16 h-16" />}
      isLoading={isLoading}
      isEmpty={totalCount === 0}
      isError={!!error}
      footerStartElement={
        <ButtonGroup
          activeButtonId={display}
          variant="neutral"
          size="xs"
          buttons={[
            {
              id: 'circular',
              icon: 'pie-chart-2-line',
              onClick: () => setDisplay('circular'),
            },
            {
              id: 'row',
              icon: 'layout-grid-line',
              onClick: () => setDisplay('row'),
            },
          ]}
        />
      }
      footerEndButtons={
        totalCount > 3 && defaultKey
          ? [
              {
                variant: 'grey',
                size: 'sm',
                href: makeTdbPlansEtActionsModuleUrl({
                  collectiviteId,
                  module: defaultKey,
                }),
                children: 'Voir les plans',
              },
            ]
          : undefined
      }
    >
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-4">
        {plansAction?.map(
          (plan, index) =>
            index < 3 && (
              <PlanCard
                key={plan.id}
                plan={plan}
                display={display}
                link={makeCollectivitePlanActionUrl({
                  collectiviteId,
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

export default SuiviPlansModule;
