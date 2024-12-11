import classNames from 'classnames';
import { useState } from 'react';

import { FicheActionEtapeType } from '@tet/backend/fiches/fiche-action-etape/fiche-action-etape.table';
import { Button, Checkbox } from '@tet/ui';

import ModalDeleteEtape from './modal-delete-etape';
import { useUpsertEtape } from './use-upsert-etape';
import { Textarea } from './textarea';

type Props = {
  etape: FicheActionEtapeType;
  isCreationEtape?: boolean;
  isReadonly: boolean;
};

export const Etape = ({ etape, isReadonly, isCreationEtape }: Props) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { mutate: updateEtape } = useUpsertEtape();

  return (
    <div
      className={classNames(
        'group relative flex items-start w-full p-4 rounded-lg hover:bg-grey-2',
        { 'bg-error-2 bg-opacity-50': isDeleteModalOpen }
      )}
    >
      <Checkbox
        checked={etape.realise}
        disabled={isReadonly && isCreationEtape}
        onChange={() =>
          !isCreationEtape &&
          updateEtape({
            id: etape.id,
            ficheId: etape.ficheId,
            ordre: etape.ordre,
            realise: !etape.realise,
          })
        }
      />
      <Textarea
        nom={etape.nom}
        realise={etape.realise}
        placeholder="Renseigner l'étape."
        disabled={isReadonly}
        onBlur={(newTitle) => {
          if (newTitle.length) {
            updateEtape({
              id: etape.id,
              ficheId: etape.ficheId,
              ordre: etape.ordre,
              realise: etape.realise,
              nom: newTitle,
            });
          } else {
            setIsDeleteModalOpen(true);
          }
        }}
      />
      {/** Actions visibles au hover */}
      {!isReadonly && (
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
