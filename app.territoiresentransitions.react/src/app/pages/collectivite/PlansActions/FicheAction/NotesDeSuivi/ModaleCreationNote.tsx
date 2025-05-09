import { getYearsOptions } from '@/app/app/pages/collectivite/PlansActions/FicheAction/utils';
import {
  Alert,
  Button,
  Field,
  FormSectionGrid,
  Modal,
  ModalFooter,
  Select,
  Textarea,
} from '@/ui';
import { useState } from 'react';
import { EditedNote } from '../data/useUpsertNoteSuivi';

type ModaleCreationNoteProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  onEdit: (editedNote: EditedNote) => void;
};

const ModaleCreationNote = ({
  isOpen,
  setIsOpen,
  onEdit,
}: ModaleCreationNoteProps) => {
  const { yearsOptions } = getYearsOptions();

  const [year, setYear] = useState<number | undefined>();
  const [note, setNote] = useState<string | undefined>();

  const handleSave = () => {
    if (note !== undefined && note.trim().length > 0 && year !== undefined) {
      onEdit({ note, year });
    }
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Note de suivi et points de vigilance"
      size="lg"
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          <Alert
            className="col-span-2"
            description="Vous pouvez ajouter des éléments de suivi annuels, ou sur une maille temporelle plus fine ! Sélectionnez l'année concernée et précisez la date ou période de suivi plus précise directement dans votre commentaire"
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
      // Boutons pour valider les modifications
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

export default ModaleCreationNote;
