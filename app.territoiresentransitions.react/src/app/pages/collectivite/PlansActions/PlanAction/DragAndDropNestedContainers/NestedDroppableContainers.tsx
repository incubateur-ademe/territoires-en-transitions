import { useDroppable } from '@dnd-kit/core';
import classNames from 'classnames';

import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { AxeActions } from '../AxeActions';
import { PlanNode } from '../data/types';
import { childrenOfPlanNodes } from '../data/utils';
import Axe, { AxeDndData } from './Axe';
import Fiches from './Fiches';

interface Props {
  plan: PlanNode;
  axe: PlanNode;
  axes: PlanNode[];
  isAxePage: boolean;
}

/**
 * Racine de l'arborescence des fiches et axes d'un plan.
 * Bien que contenant des fiches et axes comme le composant `Axe`,
 * il difère car les actions de création sont différentes et la surface de drop d'un élément est aussi différente.
 */
function NestedDroppableContainers({ plan, axe, axes, isAxePage }: Props) {
  const collectivite = useCurrentCollectivite();

  const {
    isOver,
    active,
    setNodeRef: droppableRef,
  } = useDroppable({
    id: axe.id * 5000,
    data: {
      type: 'axe',
      axe,
    } as AxeDndData,
  });

  const isDroppable =
    (active?.data.current?.type === 'axe' &&
      active.data.current.axe.parent !== axe.id) ||
    (active?.data.current?.type === 'fiche' &&
      active.data.current.axeId !== axe.id);

  return (
    <div className="flex flex-col">
      {!collectivite?.isReadOnly && (
        <div className="mb-4">
          <AxeActions plan={plan} axe={axe} />
        </div>
      )}
      {isDroppable && (
        <div
          ref={droppableRef}
          className={classNames(
            'p-6 text-sm text-center text-indigo-400 rounded-md border border-dashed border-primary',
            { 'bg-bf925': isOver }
          )}
        >
          {"Glisser l'élément ici pour le mettre à la racine"}
        </div>
      )}
      {axe.fiches && axe.fiches.length > 0 && (
        <Fiches
          isDndActive={active !== null}
          isAxePage={isAxePage}
          ficheIds={axe.fiches}
          planId={plan.id}
          axeId={axe.id}
        />
      )}
      {childrenOfPlanNodes(axe, axes).map((axe) => (
        <Axe
          key={axe.id}
          plan={plan}
          axe={axe}
          axes={axes}
          isAxePage={isAxePage}
          isReadonly={collectivite!.isReadOnly}
        />
      ))}
    </div>
  );
}

export default NestedDroppableContainers;
