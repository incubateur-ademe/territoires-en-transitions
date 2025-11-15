import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { getMaxLengthMessage } from '@/app/utils/formatUtils';
import { FicheResume } from '@/domain/plans';
import { Button, Field, ModalFooterOKCancel, RichTextEditor } from '@/ui';
import { useState } from 'react';
import { NOTES_MAX_LENGTH } from './ModaleCreationNote';

type ModaleEditionNoteProps = {
  fiche: FicheResume;
  notes: string;
  updateNotes: (notes: string | null) => void;
};

const ModaleEditionNote = ({
  fiche,
  notes,
  updateNotes,
}: ModaleEditionNoteProps) => {
  const [editedNotes, setEditedNotes] = useState(notes);

  const handleSave = () => {
    if (notes !== editedNotes) {
      updateNotes(editedNotes);
    }
  };

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      title="Modifier la note"
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
            message={getMaxLengthMessage(editedNotes, NOTES_MAX_LENGTH, true)}
          >
            <RichTextEditor
              initialValue={notes}
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
    >
      <Button
        icon="edit-line"
        title="Modifier la note"
        variant="grey"
        size="xs"
      />
    </BaseUpdateFicheModal>
  );
};

export default ModaleEditionNote;
