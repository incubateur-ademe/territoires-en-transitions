import {createPortal} from 'react-dom';
import {DragOverlay, useDraggable} from '@dnd-kit/core';

import FicheActionCard from '../../FicheAction/Carte/FicheActionCard';
import {FicheResume} from '../../FicheAction/data/types';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import classNames from 'classnames';
import {QueryKey} from 'react-query';

export type FicheDndData = {
  type: 'fiche';
  axeId: number;
  fiche: FicheResume;
};

type Props = {
  planId: number;
  axeId: number;
  url?: string;
  fiche: FicheResume;
  editKeysToInvalidate?: QueryKey[];
};

const Fiche = ({planId, axeId, url, fiche, editKeysToInvalidate}: Props) => {
  const collectivite = useCurrentCollectivite();

  const canDrag =
    collectivite?.niveau_acces === 'admin' ||
    collectivite?.niveau_acces === 'edition';

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
    disabled: !canDrag,
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
          className={classNames('h-full', {'cursor-default': !canDrag})}
          ref={draggableRef}
          {...listeners}
          {...attributes}
        >
          <FicheActionCard
            key={fiche.id}
            ficheAction={fiche}
            axeIdToInvalidate={axeId}
            link={url}
            isEditable
            editKeysToInvalidate={editKeysToInvalidate}
          />
        </div>
      )}
    </div>
  );
};

export default Fiche;
