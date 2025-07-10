import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { FicheResume } from '@/domain/plans/fiches';
import { DragOverlay, useDraggable } from '@dnd-kit/core';
import classNames from 'classnames';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { QueryKey } from 'react-query';
import FicheActionCard from '../../../../app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';

export type FicheDndData = {
  type: 'fiche';
  fiche: FicheResume;
};

type Props = {
  url?: string;
  fiche: FicheResume;
  editKeysToInvalidate?: QueryKey[];
  collectivite: CurrentCollectivite;
};

export const DraggableFicheCard = ({
  url,
  fiche,
  editKeysToInvalidate,
  collectivite,
}: Props) => {
  const canDrag =
    collectivite?.niveauAcces === 'admin' ||
    collectivite?.niveauAcces === 'edition';

  const [isDisabled, setIsDisabled] = useState(!canDrag);

  const {
    active,
    attributes,
    listeners,
    setNodeRef: draggableRef,
  } = useDraggable({
    id: fiche.id,
    data: {
      type: 'fiche',
      fiche,
    },
    disabled: isDisabled,
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
              <FicheActionCard
                ficheAction={fiche}
                link=""
                currentCollectivite={collectivite}
              />
            </div>
          </DragOverlay>,
          document.body
        )}
      {!active && (
        <div
          className={classNames('h-full', { 'cursor-default': isDisabled })}
          ref={draggableRef}
          {...listeners}
          {...attributes}
        >
          <FicheActionCard
            key={fiche.id}
            ficheAction={fiche}
            link={url}
            isEditable
            editKeysToInvalidate={editKeysToInvalidate}
            onToggleOpen={(isOpen) => setIsDisabled(isOpen)}
            currentCollectivite={collectivite}
          />
        </div>
      )}
    </div>
  );
};
