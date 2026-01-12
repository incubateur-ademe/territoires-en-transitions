import { PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { childrenOfPlanNodes } from '../../utils';
import { Axe } from './axe/axe';
import { FichesList } from './fiches.list';

interface Props {
  plan: PlanNode;
  axes: PlanNode[];
  collectivite: CollectiviteAccess;
}

export const PlanTree = ({ plan, axes, collectivite }: Props) => {
  return (
    <div className="flex flex-col gap-2 mt-4">
      {/** Fiches à la racine du plan */}
      <FichesList
        collectivite={collectivite}
        isDndActive={false}
        ficheIds={plan.fiches}
        axeId={plan.id}
        planId={plan.id}
      />
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
