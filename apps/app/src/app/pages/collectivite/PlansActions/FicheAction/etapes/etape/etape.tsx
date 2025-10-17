import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';
import { useState } from 'react';

import { Button, Checkbox } from '@/ui';

import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { FicheActionEtapeType } from '@/domain/plans';
import { useEtapesDispatch } from '../etapes-context';
import ModalDeleteEtape from './modal-delete-etape';
import { Textarea } from './textarea';
import { useUpsertEtape } from './use-upsert-etape';

type Props = {
  etape: FicheActionEtapeType;
  fiche: FicheShareProperties;
  isReadonly: boolean;
};

export const Etape = ({ etape, fiche, isReadonly }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: etape.id,
    disabled: isReadonly,
  });

  // permet de corriger un bug de hauteur avec le scale de l'élêment qui est drag
  const custromTransform = transform
    ? isDragging
      ? { ...transform, scaleY: 1 } // renforce le scale
      : transform
    : null;

  const style = {
    transform: CSS.Transform.toString(custromTransform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const dispatchEtapes = useEtapesDispatch();
  const { mutate: updateEtape } = useUpsertEtape();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={classNames(
        'group relative flex items-start w-full p-4 rounded-lg',

        {
          'bg-error-2 bg-opacity-50': isDeleteModalOpen,
          'hover:bg-grey-2': !isReadonly,
          'cursor-default': isReadonly,
          'z-10 hover:cursor-grabbing': isDragging,
        }
      )}
    >
      <Checkbox
        checked={etape.realise}
        disabled={isReadonly}
        className={classNames({ '!cursor-default': isReadonly })}
        onChange={() => {
          dispatchEtapes({
            type: 'toggleRealise',
            payload: {
              etapeId: etape.id,
            },
          });
          updateEtape({
            ...etape,
            realise: !etape.realise,
          });
        }}
      />
      <Textarea
        nom={etape.nom}
        realise={etape.realise}
        placeholder="Renseigner l'étape."
        disabled={isReadonly}
        className={classNames({
          'cursor-grabbing': isDragging,
          '!cursor-default': isReadonly,
        })}
        onBlur={(newTitle) => {
          if (newTitle.length) {
            dispatchEtapes({
              type: 'updateNom',
              payload: {
                etapeId: etape.id,
                nom: newTitle,
              },
            });
            updateEtape({
              ...etape,
              nom: newTitle,
            });
          } else {
            setIsDeleteModalOpen(true);
          }
        }}
      />
      {/** Actions visibles au hover */}
      {!isReadonly && !isDragging && (
        <div className="invisible group-hover:visible absolute top-3 right-3">
          <Button
            className="hover:!bg-grey-3"
            icon="delete-bin-6-line"
            size="xs"
            variant="grey"
            onClick={() => setIsDeleteModalOpen(true)}
          />
          {isDeleteModalOpen && (
            <ModalDeleteEtape
              fiche={fiche}
              etapeId={etape.id}
              openState={{
                isOpen: isDeleteModalOpen,
                setIsOpen: setIsDeleteModalOpen,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
