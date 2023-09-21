import {createPortal} from 'react-dom';
import {DragOverlay, useDraggable} from '@dnd-kit/core';

import FicheActionCard from '../../FicheAction/Carte/FicheActionCard';
import {FicheResume} from '../../FicheAction/data/types';

export type FicheDndData = {
  type: 'fiche';
  axeId: number;
  fiche: FicheResume;
};

type Props = {
  axeId: number;
  url?: string;
  fiche: FicheResume;
};

const Fiche = ({axeId, url, fiche}: Props) => {
  const {
    active,
    attributes,
    listeners,
    setNodeRef: draggableRef,
  } = useDraggable({
    id: fiche.id!,
    data: {
      axeId,
      type: 'fiche',
      fiche,
    },
  });

  const isDragging =
    active?.data.current?.fiche?.id === fiche.id &&
    active.data.current?.type === 'fiche';

  return (
    <div id={`fiche-${fiche.id?.toString()}`} className="relative self-stretch">
      {/** Drag overlay */}
      {isDragging &&
        createPortal(
          <DragOverlay dropAnimation={null}>
            <div className="w-[24rem] ml-1 opacity-80 !cursor-grabbing">
              <FicheActionCard ficheAction={fiche} link="" />
            </div>
          </DragOverlay>,
          document.body
        )}
      {!active && (
        <div
          className="h-full"
          ref={draggableRef}
          {...listeners}
          {...attributes}
        >
          <FicheActionCard
            key={fiche.id}
            ficheAction={fiche}
            link={url}
            isEditable
          />
        </div>
      )}
    </div>
  );
};

export default Fiche;
