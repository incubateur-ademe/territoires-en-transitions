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

import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheActionEtapeType } from '@/domain/plans/fiches/';
import { Etape, useUpsertEtape } from './etape';
import { useEtapesDispatch } from './etapes-context';

type Props = {
  fiche: FicheShareProperties;
  etapes: FicheActionEtapeType[];
  isReadonly: boolean;
};

const EtapesList = ({ fiche, etapes, isReadonly }: Props) => {
  const ficheId = fiche.id;

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
            <Etape
              key={etape.id}
              etape={etape}
              fiche={fiche}
              isReadonly={isReadonly}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default EtapesList;
