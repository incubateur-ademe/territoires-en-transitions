import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import PictoLeaf from '@/app/ui/pictogrammes/PictoLeaf';
import { PlanNode } from '../../types';
import { useDragAxe } from '../data/use-drag-axe';
import { NestedDroppableContainers } from './NestedDroppableContainers';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import { FicheResume } from '@/domain/plans/fiches';

import './dropAnimation.css';

interface Props {
  plan: PlanNode;
  axes: PlanNode[];
  collectivite: CurrentCollectivite;
}

const EmptyPlan = () => {
  return (
    <div className="flex flex-col items-center my-8">
      <PictoLeaf className="w-24 fill-gray-400" />
      <div className="my-6 text-gray-500">
        Aucune arborescence pour l&apos;instant
      </div>
    </div>
  );
};

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

  const hasFiches = plan.fiches && plan.fiches.length > 0;
  const hasAxes = axes.some((axe) => axe.depth > 0);
  const isPlanEmpty = !hasFiches && !hasAxes;
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={(event) => {
        handleDragEnd(event);
      }}
    >
      {isPlanEmpty ? (
        <EmptyPlan />
      ) : (
        <NestedDroppableContainers
          plan={plan}
          axes={axes}
          collectivite={collectivite}
        />
      )}
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
