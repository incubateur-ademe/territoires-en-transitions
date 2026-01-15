import { PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { childrenOfPlanNodes } from '../../utils';
import { Axe } from './axe/axe';
import { FichesList } from './fiches.list';
import { PlanDisplayOptionsEnum, usePlanOptions } from './plan-options.context';

interface Props {
  plan: PlanNode;
  axes: PlanNode[];
  collectivite: CollectiviteAccess;
}

export const PlanTree = ({ plan, axes, collectivite }: Props) => {
  const planOptions = usePlanOptions();

  return (
    <div className="flex flex-col gap-2 mt-4">
      {/** Fiches à la racine du plan */}
      {planOptions.isOptionEnabled(PlanDisplayOptionsEnum.ACTIONS) && (
        <FichesList
          collectivite={collectivite}
          ficheIds={plan.fiches}
          axeId={plan.id}
          planId={plan.id}
        />
      )}
      {/** Arborescence des axes */}
      <div className="flex flex-col gap-4">
        {childrenOfPlanNodes(plan, axes).map((axe) => (
          <Axe
            key={axe.id}
            rootAxe={plan}
            axe={axe}
            axes={axes}
            collectivite={collectivite}
          />
        ))}
      </div>
    </div>
  );
};
