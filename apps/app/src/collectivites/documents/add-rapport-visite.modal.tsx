import { appLabels } from '@/app/labels/catalog';
import { AddDocumentTabs } from './add-document/add-document.tabs';
import { Button, Field, Input, Modal } from '@tet/ui';
import { format } from 'date-fns';
import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { useAddRapportVisite } from './use-add-rapport-visite';

export const AddRapportVisiteModal = () => {
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
          ? `${appLabels.champDateVisite} : ${format(
              new Date(date),
              'dd/MM/yyyy'
            )}`
          : undefined
      }
      render={({ close }) => {
        return !date ? (
          <SelectDate setDate={setDate} />
        ) : (
          <AddDocumentTabs onClose={close} handlers={handlers} />
        );
      }}
    >
      <Button
        aria-label={appLabels.ajouterRapportVisite}
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

const SelectDate = ({ setDate }: { setDate: (value: string) => void }) => {
  const [isValid, setIsValid] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Field title={appLabels.champDateVisiteAnnuelle}>
        <Input
          type="date"
          ref={inputRef}
          pattern="\d{4}-\d{2}-\d{2}"
          onChange={(e) => {
            setIsValid(e.target.validity.valid || false);
            setValue(e.target.value || '');
          }}
        />
      </Field>
      <Button disabled={!isValid} onClick={() => value && setDate(value)}>
        {appLabels.ajouterRapport}
      </Button>
    </>
  );
};
