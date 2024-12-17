import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { RouterOutput } from '@/api/utils/trpc/client';

import { Etape, useUpsertEtape } from './etape';
import { useEtapesDispatch } from './etapes-context';

type Etapes = RouterOutput['plans']['fiches']['etapes']['list'];

type Props = {
  ficheId: number;
  etapes: Etapes;
  isReadonly: boolean;
};

const EtapesList = ({ ficheId, etapes, isReadonly }: Props) => {
  const dispatchEtapes = useEtapesDispatch();
  const { mutateAsync: updateEtapeOrder } = useUpsertEtape();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!(over && active.id !== over.id)) {
      return;
    }

    const activeEtape = etapes.find((etape) => etape.id === active.id);
    const overEtape = etapes.find((etape) => etape.id === over.id);

    if (activeEtape && overEtape) {
      updateEtapeOrder({
        id: activeEtape.id,
        ficheId,
        ordre: overEtape.ordre,
      });
      dispatchEtapes({
        type: 'updateOrder',
        payload: {
          etapeId: activeEtape.id,
          oldOrder: activeEtape.ordre,
          newOrder: overEtape.ordre,
        },
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={etapes} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1">
          {etapes.map((etape) => (
            <Etape key={etape.id} etape={etape} isReadonly={isReadonly} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default EtapesList;
