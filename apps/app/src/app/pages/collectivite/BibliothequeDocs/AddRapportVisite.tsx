import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { Button, Field, InputDate, Modal } from '@tet/ui';
import { format } from 'date-fns';
import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { useAddRapportVisite } from './useAddRapportVisite';

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * un rapport de visite annuelle
 */
export const AddRapportVisite = () => {
  const [opened, setOpened] = useState(false);
  const [date, setDate] = useState('');
  const handlers = useAddRapportVisite(date);

  const onSetOpened: Dispatch<SetStateAction<boolean>> = (value) => {
    setOpened(value);
    // quand on ferme le dialogue il faut aussi réinitialiser la date
    // sélectionnée pour que le sélecteur ré-apparaisse bien lors de la
    // prochaine ouverture
    if (!value) {
      setDate('');
    }
  };

  return (
    <Modal
      size="lg"
      openState={{ isOpen: opened, setIsOpen: onSetOpened }}
      title={appLabels.ajouterRapportVisite}
      subTitle={
        date
          ? `${appLabels.champDateVisite} : ${format(new Date(date), 'dd/MM/yyyy')}`
          : undefined
      }
      render={({ close }) => {
        return !date ? (
          <SelectDate setDate={setDate} />
        ) : (
          <AddPreuveModal onClose={close} handlers={handlers} />
        );
      }}
    >
      <Button
        dataTest="AddDocsButton"
        icon="add-line"
        variant="outlined"
        size="sm"
        onClick={() => setOpened(true)}
      >
        {appLabels.ajouter}
      </Button>
    </Modal>
  );
};

/** Affiche le sélecteur de date */
const SelectDate = ({ setDate }: { setDate: (value: string) => void }) => {
  const [isValid, setIsValid] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Field title={appLabels.champDateVisiteAnnuelle}>
        <InputDate
          ref={inputRef}
          pattern="\d{4}-\d{2}-\d{2}"
          onChange={(e) => {
            setIsValid(e.target.validity.valid || false);
            setValue(e.target.value || '');
          }}
        />
      </Field>
      <Button
        dataTest="date-visite"
        disabled={!isValid}
        onClick={() => value && setDate(value)}
      >
        {appLabels.ajouterRapport}
      </Button>
    </>
  );
};
