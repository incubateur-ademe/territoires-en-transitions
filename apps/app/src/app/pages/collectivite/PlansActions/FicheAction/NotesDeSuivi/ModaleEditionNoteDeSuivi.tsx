import { FicheActionNote } from '@/api/plan-actions';
import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { FicheResume } from '@/domain/plans';
import {
  Field,
  FormSectionGrid,
  ModalFooterOKCancel,
  RichTextEditor,
  Select,
} from '@/ui';
import { useState } from 'react';
import { EditedNote } from '../data/useUpsertNoteSuivi';

type ModaleEditionNoteDeSuiviProps = {
  fiche: FicheResume;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  editedNote: FicheActionNote;
  onEdit: (editedNote: EditedNote) => void;
};

const ModaleEditionNoteDeSuivi = ({
  fiche,
  isOpen,
  setIsOpen,
  editedNote,
  onEdit,
}: ModaleEditionNoteDeSuiviProps) => {
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
      onEdit({ id: editedNote.id, note, year });
    }
  };

  return (
    <BaseUpdateFicheModal
      openState={{ isOpen, setIsOpen }}
      fiche={fiche}
      title="Modifier la note"
      subTitle={`Note de suivi ${year}${
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

export default ModaleEditionNoteDeSuivi;
