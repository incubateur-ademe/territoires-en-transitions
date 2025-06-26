import classNames from 'classnames';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { PlanNode } from '@/app/plans/plans/types';
import { TPlanType } from '@/app/types/alias';
import { Breadcrumbs } from '@/ui/design-system/Breadcrumbs';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { Actions } from './Actions';
import { PlanActionStatus } from './PlanActionStatus';

type TPlanActionHeader = {
  plan: PlanNode;
  axes: PlanNode[];
  axeHasFiches: boolean;
  collectivite: CurrentCollectivite;
  planType: TPlanType | null;
};

const Title = ({ axe, size }: { axe: PlanNode; size: 'lg' | 'sm' }) => (
  <span
    className={classNames('text-primary-9 font-bold leading-snug', {
      'text-[2.5rem]': size === 'lg',
      'text-[1.5rem]': size === 'sm',
    })}
  >
    {axe.nom}
  </span>
);

export const Header = ({
  collectivite,
  plan,
  axes,
  axeHasFiches,
  planType,
}: TPlanActionHeader) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-between">
          <Title axe={plan} size="lg" />
          <VisibleWhen condition={collectivite.isReadOnly === false}>
            <Actions
              collectiviteId={collectivite.collectiviteId}
              type={planType}
              plan={plan}
              axes={axes}
              axeHasFiches={axeHasFiches}
            />
          </VisibleWhen>
        </div>
        <Breadcrumbs
          size="sm"
          items={[
            {
              label: "Tous les plans d'action",
            },
            { label: plan.nom },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2 grow">
        <span className="text-sm uppercase text-grey-8 font-normal">
          {planType?.type || 'Sans type'}
        </span>
        <PlanActionStatus planId={plan.id} />
      </div>
    </div>
  );
};
