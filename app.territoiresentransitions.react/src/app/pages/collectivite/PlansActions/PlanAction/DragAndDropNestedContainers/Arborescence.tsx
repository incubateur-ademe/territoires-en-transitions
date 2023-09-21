import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {PlanNode} from '../data/types';
import {getAxeInPlan} from '../data/utils';
import NestedDroppableContainers from './NestedDroppableContainers';
import {useFicheChangeAxe} from '../../FicheAction/data/useFicheChangeAxe';
import PictoLeaf from 'ui/pictogrammes/PictoLeaf';
import {AxeActions} from '../AxeActions';
import {useDragAxe} from '../data/useDragAxe';

import './dropAnimation.css';

interface Props {
  plan: PlanNode;
  axe: PlanNode;
  isAxePage: boolean;
  isReadonly: boolean;
}

function Arborescence({plan, axe, isAxePage, isReadonly}: Props) {
  const {mutate: changeAxeFiche} = useFicheChangeAxe();
  const {mutate: updateAxe} = useDragAxe(axe.id);

  const keyboardCodes = {
    start: ['Enter'],
    cancel: ['Escape'],
    end: ['Enter'],
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,
      },
    }),
    useSensor(KeyboardSensor, {keyboardCodes})
  );

  const hasContent =
    axe.children.length > 0 || (axe.fiches && axe.fiches.length > 0);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={event => {
        handleDragEnd(event);
      }}
    >
      {hasContent ? (
        <NestedDroppableContainers
          plan={plan}
          axe={axe}
          isAxePage={isAxePage}
        />
      ) : (
        <div className="flex flex-col items-center my-8">
          <PictoLeaf className="w-24 fill-gray-400" />
          <div className="my-6 text-gray-500">
            Aucune arborescence pour l'instant
          </div>
          {!isReadonly && (
            <AxeActions
              isAxePage={isAxePage}
              planActionId={plan.id}
              axeId={axe ? axe.id : plan.id}
            />
          )}
        </div>
      )}
    </DndContext>
  );

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;

    const activeData = active.data.current;
    const overData = over?.data.current;

    // il faut que l'élément drag soit au dessus d'un drop pour faire une action
    if (over && overData) {
      // si c'est une fiche
      if (activeData?.type === 'fiche') {
        // si on déplace à la racine de la page plan/axe
        if (axe.id === overData.axe.id) {
          changeAxeFiche({
            fiche: activeData.fiche,
            plan_id: axe.id,
            new_axe_id: axe.id,
            old_axe_id: activeData.axeId,
          });
        } else {
          // Si la fiche n'existe pas déjà dans l'axe on l'ajoute
          if (
            !activeData?.fiche.plans.some(
              (plan: PlanNode) => plan.id === overData.axe.id
            )
          ) {
            const newAxe = getAxeInPlan(axe, overData.axe.id);
            if (newAxe) {
              changeAxeFiche({
                fiche: activeData.fiche,
                plan_id: axe.id,
                new_axe_id: newAxe.id,
                old_axe_id: activeData.axeId,
              });
            }
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

/** Animation utilisée au drop d'un élément (axe ou fiche) */
export const dropAnimation = (elementId: string) => {
  const element = document.getElementById(elementId);
  element?.scrollIntoView({behavior: 'smooth', block: 'center'});
  element?.classList.add('drop-animation');
};
