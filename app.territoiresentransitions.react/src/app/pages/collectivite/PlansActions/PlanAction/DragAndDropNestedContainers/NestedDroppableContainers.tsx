import classNames from 'classnames';
import {useDroppable} from '@dnd-kit/core';

import Axe, {AxeDndData} from './Axe';
import {PlanNode} from '../data/types';
import Fiches from './Fiches';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {AxeActions} from '../AxeActions';

interface Props {
  plan: PlanNode;
  isAxePage: boolean;
}

function NestedDroppableContainers({plan, isAxePage}: Props) {
  const collectivite = useCurrentCollectivite();

  const {
    isOver,
    active,
    setNodeRef: droppableRef,
  } = useDroppable({
    id: plan.id * 50,
    data: {
      type: 'axe',
      axe: plan,
    } as AxeDndData,
  });

  const isDroppable =
    (active?.data.current?.type === 'axe' &&
      active.data.current.axe.ancestors &&
      active.data.current.axe.ancestors[
        active.data.current.axe.ancestors.length - 1
      ] !== plan.id) ||
    (active?.data.current?.type === 'fiche' &&
      active.data.current.axeId !== plan.id);

  return (
    <div className="flex flex-col">
      {!collectivite?.readonly && (
        <div className="mb-4">
          <AxeActions
            isAxePage={isAxePage}
            planActionId={plan.id}
            axeId={plan.id}
          />
        </div>
      )}
      {isDroppable && (
        <div
          ref={droppableRef}
          className={classNames(
            'p-6 text-sm text-center text-indigo-400 rounded-md border border-dashed border-bf925hover',
            {'bg-bf925': isOver}
          )}
        >
          Glisser l'élément ici pour le mettre à la racine
        </div>
      )}
      {plan.fiches && plan.fiches.length > 0 && (
        <Fiches
          isDndActive={active !== null}
          isAxePage={isAxePage}
          ficheIds={plan.fiches}
          planId={plan.id}
          axeId={plan.id}
        />
      )}
      {plan.children.length > 0 &&
        plan.children.map(axe => (
          <Axe
            key={axe.id}
            plan={plan}
            axe={axe}
            isAxePage={isAxePage}
            isReadonly={collectivite!.readonly}
          />
        ))}
    </div>
  );
}

export default NestedDroppableContainers;
