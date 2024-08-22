import {useEffect, useState} from 'react';
import {Field, Modal, ModalFooterOKCancel, Textarea} from '@tet/ui';
import {getMaxLengthMessage} from '../../utils';

export const NOTES_MAX_LENGTH = 20000;

type ModaleCreationNoteProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  updateNotes: (notes: string | null) => void;
};

const ModaleCreationNote = ({
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
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Ajouter une note"
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
            message={getMaxLengthMessage(editedNotes ?? '', NOTES_MAX_LENGTH)}
          >
            <Textarea
              className="min-h-[100px]"
              value={editedNotes ?? ''}
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
    />
  );
};

export default ModaleCreationNote;
