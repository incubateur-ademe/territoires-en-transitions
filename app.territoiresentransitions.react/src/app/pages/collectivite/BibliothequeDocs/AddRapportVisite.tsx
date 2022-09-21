import {useState} from 'react';
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

  return (
    <Modal
      size="lg"
      externalOpen={opened}
      setExternalOpen={setOpened}
      render={() => {
        return (
          <>
            <h4>Ajouter un rapport de visite annuelle</h4>
            {!date ? (
              <SelectDate date={date} setDate={setDate} />
            ) : (
              <AddPreuveModal
                onClose={() => setOpened(false)}
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
const SelectDate = ({
  date,
  setDate,
}: {
  date: string;
  setDate: (value: string) => void;
}) => {
  return (
    <fieldset className="fr-fieldset h-52">
      <label className="fr-label mb-2">
        Date de la visite annuelle (obligatoire)
      </label>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />
    </fieldset>
  );
};
