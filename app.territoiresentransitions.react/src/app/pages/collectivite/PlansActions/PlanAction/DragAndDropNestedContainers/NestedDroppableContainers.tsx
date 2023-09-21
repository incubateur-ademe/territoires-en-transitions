import classNames from 'classnames';
import {useDroppable} from '@dnd-kit/core';

import Axe, {AxeDndData} from './Axe';
import {PlanNode} from '../data/types';
import Fiches from './Fiches';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {AxeActions} from '../AxeActions';

interface Props {
  plan: PlanNode;
  axe: PlanNode;
  isAxePage: boolean;
}

function NestedDroppableContainers({plan, axe, isAxePage}: Props) {
  const collectivite = useCurrentCollectivite();

  const {
    isOver,
    active,
    setNodeRef: droppableRef,
  } = useDroppable({
    id: axe.id * 50,
    data: {
      type: 'axe',
      axe,
    } as AxeDndData,
  });

  const isDroppable =
    (active?.data.current?.type === 'axe' &&
      active.data.current.axe.ancestors &&
      active.data.current.axe.ancestors[
        active.data.current.axe.ancestors.length - 1
      ] !== axe.id) ||
    (active?.data.current?.type === 'fiche' &&
      active.data.current.axeId !== axe.id);

  return (
    <div className="flex flex-col">
      {!collectivite?.readonly && (
        <div className="mb-4">
          <AxeActions planActionId={plan.id} axeId={axe.id} />
        </div>
      )}
      {isDroppable && (
        <div
          ref={droppableRef}
          className={classNames(
            'p-6 text-sm text-center text-indigo-400 rounded-md border border-dashed border-bf525',
            {'bg-bf925': isOver}
          )}
        >
          Glisser l'élément ici pour le mettre à la racine
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
      {axe.children.length > 0 &&
        axe.children.map(axe => (
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
