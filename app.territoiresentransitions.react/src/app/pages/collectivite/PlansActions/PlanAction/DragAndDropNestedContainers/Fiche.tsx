import {createPortal} from 'react-dom';
import classNames from 'classnames';
import {DragOverlay, useDraggable} from '@dnd-kit/core';

import FicheActionCard from '../../FicheAction/FicheActionCard';
import {FicheResume} from '../../FicheAction/data/types';
import DragIcon from './DragIcon';

export type FicheDndData = {
  type: 'fiche';
  axeId: number;
  fiche: FicheResume;
};

type Props = {
  axeId: number;
  url: string;
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
    <div id={fiche.id?.toString()} className="relative self-stretch">
      {/** Drag overlay */}
      {isDragging &&
        createPortal(
          <DragOverlay dropAnimation={null}>
            <div className="w-[24rem] ml-1 opacity-80 cursor-grabbing">
              <FicheActionCard ficheAction={fiche} link="" />
            </div>
          </DragOverlay>,
          document.body
        )}
      {!active && (
        <div className="relative group h-full">
          {/** Drag handle */}
          <div className="absolute top-2 right-2">
            <button
              ref={draggableRef}
              title="Déplacer"
              className={classNames('my-auto p-2', {
                'hidden group-hover:block bg-white': !isDragging,
                'hover:!bg-none': isDragging,
              })}
              {...listeners}
              {...attributes}
            >
              {!isDragging && <DragIcon />}
            </button>
          </div>
          <FicheActionCard key={fiche.id} ficheAction={fiche} link={url} />
        </div>
      )}
    </div>
  );
};

export default Fiche;
