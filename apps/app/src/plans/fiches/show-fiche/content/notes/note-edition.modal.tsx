import {
  FicheNote,
  FicheNoteUpsert,
  FicheWithRelations,
} from '@tet/domain/plans';
import {
  Field,
  FormSectionGrid,
  ModalFooterOKCancel,
  RichTextEditor,
  Select,
} from '@tet/ui';
import { useState } from 'react';
import { BaseUpdateFicheModal } from '../../components/base-update-fiche.modal';
import { getYearsOptions } from '../../utils';

type NoteEditionModalProps = {
  fiche: FicheWithRelations;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  editedNote: FicheNote;
  onEdit: (editedNote: FicheNoteUpsert) => void;
};

export const NoteEditionModal = ({
  fiche,
  isOpen,
  setIsOpen,
  editedNote,
  onEdit,
}: NoteEditionModalProps) => {
  const { yearsOptions } = getYearsOptions();

  const initialYear = new Date(editedNote.dateNote).getFullYear();
  const [year, setYear] = useState<number>(
    new Date(editedNote.dateNote).getFullYear()
  );
  const [note, setNote] = useState<string>(editedNote.note);
  const handleSave = () => {
    if (
      note.trim().length > 0 &&
      (note !== editedNote.note || year !== initialYear)
    ) {
      onEdit({
        ...editedNote,
        note,
        dateNote: `${year}-01-01`,
      });
    }
  };

  return (
    <BaseUpdateFicheModal
      openState={{ isOpen, setIsOpen }}
      fiche={fiche}
      title="Modifier la noteeee"
      subTitle={`Note ${year}${
        editedNote.createdBy
          ? ` créée par ${editedNote.createdBy.prenom} ${editedNote.createdBy.nom}`
          : ''
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
            <RichTextEditor
              placeholder="Écrire ici un commentaire"
              initialValue={editedNote.note}
              onChange={(value) => setNote(value)}
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
