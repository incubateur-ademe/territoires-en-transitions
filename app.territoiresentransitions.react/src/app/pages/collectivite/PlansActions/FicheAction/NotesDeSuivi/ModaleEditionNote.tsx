import { useState } from 'react';
import {
  Alert,
  Field,
  FormSectionGrid,
  Modal,
  ModalFooterOKCancel,
  Select,
  Textarea,
} from '@tet/ui';
import { getYearsOptions } from './ModaleCreationNote';

type ModaleEditionNoteProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  editedNote: {
    id: string;
    note: string;
    year: number;
    createdAt: string;
    createdBy: string;
    modifiedAt?: string;
    modifiedBy?: string;
  };
  updateNotes: (note: {
    id: string;
    note: string;
    year: number;
    createdAt: string;
    createdBy: string;
    modifiedAt?: string;
    modifiedBy?: string;
  }) => void;
};

const ModaleEditionNote = ({
  isOpen,
  setIsOpen,
  editedNote,
  updateNotes,
}: ModaleEditionNoteProps) => {
  const { yearsOptions } = getYearsOptions();

  const [year, setYear] = useState<number>(editedNote.year);
  const [note, setNote] = useState<string>(editedNote.note);

  const handleSave = () => {
    if (
      note.trim().length > 0 &&
      (note !== editedNote.note || year !== editedNote.year)
    ) {
      updateNotes({
        ...editedNote,
        note,
        year,
        modifiedAt: new Date().toString(),
        modifiedBy: 'Yala Dada',
      });
    }
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Modifier la note"
      subTitle={`Note de suivi ${editedNote.year}${
        editedNote.createdAt ? ` créée par ${editedNote.createdBy}` : ''
      }`}
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          <Field title="Année" className="col-span-2">
            <Select
              options={yearsOptions}
              onChange={(selectedYear) =>
                selectedYear ? setYear(selectedYear as number) : undefined
              }
              values={year}
            />
          </Field>

          <Field title="Note" className="col-span-2">
            <Textarea
              placeholder="Écrire ici un commentaire"
              value={note}
              onChange={(evt) =>
                setNote((evt.target as HTMLTextAreaElement).value)
              }
              rows={5}
            />
          </Field>
        </FormSectionGrid>
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

export default ModaleEditionNote;
