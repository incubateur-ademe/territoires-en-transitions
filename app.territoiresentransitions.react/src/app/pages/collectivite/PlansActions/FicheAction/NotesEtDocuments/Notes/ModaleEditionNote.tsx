import {useState} from 'react';
import {Button, Field, Modal, ModalFooterOKCancel, Textarea} from '@tet/ui';
import {NOTES_MAX_LENGTH} from './ModaleCreationNote';
import { getMaxLengthMessage } from 'utils/formatUtils';

type ModaleEditionNoteProps = {
  notes: string;
  updateNotes: (notes: string | null) => void;
};

const ModaleEditionNote = ({notes, updateNotes}: ModaleEditionNoteProps) => {
  const [editedNotes, setEditedNotes] = useState(notes);

  const handleSave = () => {
    if (notes !== editedNotes) {
      updateNotes(editedNotes);
    }
  };

  return (
    <Modal
      title="Modifier la note"
      size="lg"
      render={({descriptionId}) => (
        <div id={descriptionId} className="flex flex-col gap-8">
          {/* Décommenter au passage à notes privées */}
          {/* <Alert description="La note est privée, elle n’est pas consultable par les personnes n’étant pas membres de votre collectivité." /> */}

          <Field
            title="Note"
            state={
              editedNotes?.length === NOTES_MAX_LENGTH ? 'info' : 'default'
            }
            message={getMaxLengthMessage(editedNotes, NOTES_MAX_LENGTH)}
          >
            <Textarea
              className="min-h-[100px]"
              value={editedNotes}
              maxLength={NOTES_MAX_LENGTH}
              onChange={evt =>
                setEditedNotes((evt.target as HTMLTextAreaElement).value)
              }
            />
          </Field>
        </div>
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({close}) => (
        <ModalFooterOKCancel
          btnCancelProps={{onClick: close}}
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
    </Modal>
  );
};

export default ModaleEditionNote;
