import { useDroppable } from '@dnd-kit/core';
import classNames from 'classnames';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { PlanNode } from '../../types';
import { childrenOfPlanNodes } from '../../utils';
import { AxeDndData, DraggableAxe } from './draggable-axe';
import { FichesList } from './fiches.list';

interface Props {
  plan: PlanNode;
  axes: PlanNode[];
  collectivite: CurrentCollectivite;
}

/**
 * Racine de l'arborescence des fiches et axes d'un plan.
 * Bien que contenant des fiches et axes comme le composant `Axe`,
 * il difère car les actions de création sont différentes et la surface de drop d'un élément est aussi différente.
 */
export const NestedDroppableContainers = ({
  plan,
  axes,
  collectivite,
}: Props) => {
  const {
    isOver,
    active,
    setNodeRef: droppableRef,
  } = useDroppable({
    id: plan.id * 5000,
    data: {
      type: 'axe',
      axe: plan,
    } as AxeDndData,
  });

  const isDroppable =
    (active?.data.current?.type === 'axe' &&
      active.data.current.axe.parent !== plan.id) ||
    (active?.data.current?.type === 'fiche' &&
      active.data.current.axeId !== plan.id);

  return (
    <div className="flex flex-col">
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
      {plan.fiches && plan.fiches.length > 0 && (
        <FichesList
          collectivite={collectivite}
          isDndActive={active !== null}
          ficheIds={plan.fiches}
          planId={plan.id}
          axeId={plan.id}
        />
      )}
      {childrenOfPlanNodes(plan, axes).map((axe) => (
        <DraggableAxe
          key={axe.id}
          rootAxe={plan}
          axe={axe}
          axes={axes}
          isReadonly={collectivite.isReadOnly}
          collectivite={collectivite}
        />
      ))}
    </div>
  );
};
