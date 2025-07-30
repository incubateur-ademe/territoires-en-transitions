import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { PlanNode } from '@/domain/plans/plans';
import { NestedDroppableContainers } from './NestedDroppableContainers';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import { FicheResume } from '@/domain/plans/fiches';

import { useDragAxe } from '@/app/plans/plans/show-plan/data/use-drag-axe';
import './dropAnimation.css';

interface Props {
  plan: PlanNode;
  axes: PlanNode[];
  collectivite: CurrentCollectivite;
}

export const PlanArborescence = ({ plan, axes, collectivite }: Props) => {
  const { mutate: updateFiche } = useUpdateFiche({
    invalidatePlanId: plan.id,
  });
  const { mutate: moveAxe } = useDragAxe(plan.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,
      },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={(event) => {
        handleDragEnd(event);
      }}
    >
      <NestedDroppableContainers
        plan={plan}
        axes={axes}
        collectivite={collectivite}
      />
    </DndContext>
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    const activeData = active.data.current;
    const overData = over?.data.current;

    // il faut que l'élément drag soit au dessus d'un drop pour faire une action
    if (over && overData) {
      // si c'est une fiche
      if (activeData?.type === 'fiche') {
        const fiche = activeData.fiche as FicheResume;
        // Conserve tous les autres axes qui ne sont pas associés à ce plan
        const updatedAxes =
          fiche.axes
            ?.filter((axe) => axe.planId !== plan.id)
            .map((axe) => ({
              id: axe.id,
            })) || [];
        // Ajoute le nouvel axe
        updatedAxes.push({
          id: overData.axe.id,
        });

        updateFiche({
          ficheId: fiche.id,
          ficheFields: {
            axes: updatedAxes,
          },
        });
      }
      if (activeData?.type === 'axe') {
        // si c'est un axe
        // si le drag id est différent du drop id et que le drop id n'est pas le parent direct du drag
        if (
          activeData.axe.id !== overData.axe.id &&
          activeData.axe.parent !== overData.axe.id
        ) {
          moveAxe({
            axe: activeData.axe,
            newParentId: overData.axe.id,
          });
        }
      }
    }
  }
};

/** Animation utilisée au drop d'un élément (axe ou fiche) */
export const dropAnimation = (elementId: string) => {
  const element = document.getElementById(elementId);
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element?.classList.add('drop-animation');
};
