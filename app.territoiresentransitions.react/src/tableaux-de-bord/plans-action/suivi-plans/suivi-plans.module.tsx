import { useState } from 'react';

import { useCollectiviteId } from '@/api/collectivites';
import {
  makeCollectivitePlanActionUrl,
  makeTdbPlansEtActionsModuleUrl,
} from '@/app/app/paths';
import {
  PlanCard,
  PlanCardDisplay,
} from '@/app/plans/plans/components/card/plan.card';
import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import Module from '@/app/tableaux-de-bord/modules/module/module';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { ModulePlanActionListType } from '@/domain/collectivites';
import { ButtonGroup } from '@/ui';

type Props = {
  module: ModulePlanActionListType;
};

const MAX_PLANS_TO_DISPLAY = 3;
/** Module pour l'avancement des plans d'action */
export const SuiviPlansModule = ({ module }: Props) => {
  const { titre, options, defaultKey } = module;

  const collectiviteId = useCollectiviteId();

  const { plans, totalCount } = useListPlans(collectiviteId, {
    limit: MAX_PLANS_TO_DISPLAY,
  });

  /** Nb fiches action par statut affiché en donuts ou en ligne */
  const [display, setDisplay] = useState<PlanCardDisplay>('row');

  return (
    <Module
      title={titre}
      filters={options.filtre}
      symbole={<PictoDocument className="w-16 h-16" />}
      isLoading={false}
      isEmpty={totalCount === 0}
      isError={false}
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
        totalCount > MAX_PLANS_TO_DISPLAY && defaultKey
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
        {plans
          .filter((_, index) => index < MAX_PLANS_TO_DISPLAY)
          .map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              display={display}
              link={makeCollectivitePlanActionUrl({
                collectiviteId,
                planActionUid: plan.id.toString(),
              })}
            />
          ))}
      </div>
    </Module>
  );
};
