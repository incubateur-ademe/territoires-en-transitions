import {Dispatch, SetStateAction, useState} from 'react';
import Modal from 'ui/shared/floating-ui/Modal';
import {AddPreuveModal} from 'ui/shared/preuves/AddPreuveModal';
import {useAddRapportVisite} from './useAddRapportVisite';

/**
 * Affiche un bouton permettant d'ouvrir le sélecteur de fichiers pour ajouter
 * un rapport de visite annuelle
 */
export const AddRapportVisite = () => {
  const [opened, setOpened] = useState(false);
  const [date, setDate] = useState('');
  const handlers = useAddRapportVisite(date);

  const onSetOpened: Dispatch<SetStateAction<boolean>> = value => {
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
      externalOpen={opened}
      setExternalOpen={onSetOpened}
      render={() => {
        return (
          <>
            <h4>Ajouter un rapport de visite annuelle</h4>
            {!date ? (
              <SelectDate setDate={setDate} />
            ) : (
              <AddPreuveModal
                onClose={() => onSetOpened(false)}
                handlers={handlers}
              />
            )}
          </>
        );
      }}
    >
      <button
        data-test="AddDocsButton"
        className="fr-btn fr-btn--sm fr-btn--secondary"
        onClick={() => setOpened(true)}
      >
        +&nbsp;Ajouter
      </button>
    </Modal>
  );
};

/** Affiche le sélecteur de date */
const SelectDate = ({setDate}: {setDate: (value: string) => void}) => {
  const [isValid, setIsValid] = useState(false);
  const [value, setValue] = useState('');

  return (
    <fieldset className="fr-fieldset h-52" data-test="date-visite">
      <label className="fr-label mb-2">
        Date de la visite annuelle (obligatoire)
      </label>
      <div className="fr-input-wrap fr-fi-calendar-line max-w-min">
        <input
          className="fr-input"
          type="date"
          required
          pattern="\d{4}-\d{2}-\d{2}"
          onChange={e => {
            setIsValid(e.target.validity.valid || false);
            setValue(e.target.value || '');
          }}
        />
      </div>
      <br />
      <button
        className="fr-btn fr-mt-2w"
        disabled={!isValid}
        onClick={() => value && setDate(value)}
      >
        Ajouter le rapport
      </button>
    </fieldset>
  );
};
