import {useState} from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {AxeDndData} from './Axe';
import {PlanNode} from '../data/types';
import {useEditAxe} from '../data/useEditAxe';
import {useAddFicheToAxe} from '../../FicheAction/data/useAddFicheToAxe';
import {generateTitle} from '../../FicheAction/data/utils';
import {getAxeInPlan} from '../data/utils';
import NestedDroppableContainers from './NestedDroppableContainers';

interface Props {
  plan: PlanNode;
  isAxePage: boolean;
}

function Arborescence({plan, isAxePage}: Props) {
  const {mutate: addFicheToAxe, isLoading} = useAddFicheToAxe();

  const [droppedContainerData, setDroppedContainerData] =
    useState<AxeDndData>();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const {mutate: updateAxe} = useEditAxe(plan.id, {
    success: `Élément déplacé dans ${generateTitle(
      droppedContainerData?.axe.nom
    )}`,
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={event => {
        handleDragEnd(event);
      }}
    >
      <NestedDroppableContainers plan={plan} isAxePage={isAxePage} />
    </DndContext>
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;

    const activeData = active.data.current;
    const overData = over?.data.current;

    setDroppedContainerData(overData as AxeDndData);

    // il faut que l'élément drag soit au dessus d'un drop pour faire une action
    if (over && overData) {
      // si c'est une fiche
      if (activeData?.type === 'fiche') {
        console.log('fiche');
        // Si la fiche n'existe pas déjà dans l'axe on l'ajoute
        if (
          !activeData?.fiche.plans.some(
            (plan: PlanNode) => plan.id === overData.axe.id
          )
        ) {
          const axe = getAxeInPlan(plan, overData.axe.id);
          if (axe) {
            addFicheToAxe({
              axe,
              fiche_id: activeData.fiche.id,
            });
          }
        }
      }
      if (activeData?.type === 'axe') {
        // si c'est un axe
        // si le drag id est différent du drop id et que le drop id n'est pas le parent direct du drag
        if (
          activeData?.axe.id !== overData?.axe.id &&
          activeData?.axe.ancestors &&
          activeData?.axe.ancestors[activeData.axe.ancestors.length - 1] !==
            overData?.axe.id
        ) {
          console.log('axe');
          updateAxe({
            id: activeData.axe.id as number,
            parent: overData?.axe.id as number,
          });
        }
      }
    }
  }
}

export default Arborescence;
