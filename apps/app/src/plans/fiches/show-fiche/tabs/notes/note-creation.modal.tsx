import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { FicheWithRelations } from '@tet/domain/plans';
import {
  Alert,
  Button,
  Field,
  FormSectionGrid,
  ModalFooter,
  RichTextEditor,
  Select,
} from '@tet/ui';
import { useState } from 'react';
import { EditedNote } from '../../data/use-upsert-note';
import { getYearsOptions } from '../../utils';

type NoteCreationModalProps = {
  isOpen: boolean;
  fiche: FicheWithRelations;
  setIsOpen: (opened: boolean) => void;
  onEdit: (editedNote: EditedNote) => void;
};

export const NoteCreationModal = ({
  isOpen,
  fiche,
  setIsOpen,
  onEdit,
}: NoteCreationModalProps) => {
  const { yearsOptions } = getYearsOptions();

  const [year, setYear] = useState<number | undefined>();
  const [note, setNote] = useState<string | undefined>();

  const handleSave = () => {
    if (note !== undefined && note.trim().length > 0 && year !== undefined) {
      onEdit({ note, year });
    }
  };

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      openState={{ isOpen, setIsOpen }}
      title="Notes"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          <Alert
            className="col-span-2"
            description="Vous pouvez ajouter des éléments de suivi annuels, ou sur une maille temporelle plus fine. Sélectionnez l'année concernée et précisez la date ou période de suivi plus précise directement dans votre commentaire."
          />

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
              onChange={(value) => setNote(value)}
            />
          </Field>
        </FormSectionGrid>
      )}
      renderFooter={({ close }) => (
        <ModalFooter variant="right">
          <Button
            variant="outlined"
            disabled={!year || !note?.trim()}
            onClick={() => {
              handleSave();
              setYear(undefined);
              setNote('');
            }}
          >
            Valider et créer une nouvelle note
          </Button>
          <Button
            type="submit"
            disabled={!year || !note?.trim()}
            onClick={() => {
              handleSave();
              close();
            }}
          >
            Valider
          </Button>
        </ModalFooter>
      )}
    />
  );
};
