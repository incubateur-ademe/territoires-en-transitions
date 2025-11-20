import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { getMaxLengthMessage } from '@/app/utils/formatUtils';
import { Field, ModalFooterOKCancel, RichTextEditor } from '@tet/ui';
import { useEffect, useState } from 'react';
import { Fiche } from '../../data/use-get-fiche';

export const NOTES_MAX_LENGTH = 20000;

type ModaleCreationNoteProps = {
  isOpen: boolean;
  fiche: Fiche;
  setIsOpen: (opened: boolean) => void;
  updateNotes: (notes: string | null) => void;
};

const ModaleCreationNote = ({
  fiche,
  isOpen,
  setIsOpen,
  updateNotes,
}: ModaleCreationNoteProps) => {
  const [editedNotes, setEditedNotes] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setEditedNotes(null);
  }, [isOpen]);

  const handleSave = () => {
    if (editedNotes !== null) updateNotes(editedNotes);
  };

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      openState={{ isOpen, setIsOpen }}
      title="Ajouter une note"
      size="lg"
      render={({ descriptionId }) => (
        <div id={descriptionId} className="flex flex-col gap-8">
          {/* Décommenter au passage à notes privées */}
          {/* <Alert description="La note est privée, elle n’est pas consultable par les personnes n’étant pas membres de votre collectivité." /> */}

          <Field
            title="Note"
            state={
              editedNotes?.length === NOTES_MAX_LENGTH ? 'info' : 'default'
            }
            message={getMaxLengthMessage(
              editedNotes ?? '',
              NOTES_MAX_LENGTH,
              true
            )}
          >
            <RichTextEditor
              className="!bg-transparent border-none"
              onChange={(value) => setEditedNotes(value)}
            />
          </Field>
        </div>
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModaleCreationNote;
