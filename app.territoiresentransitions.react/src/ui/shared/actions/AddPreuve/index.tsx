import {UiDialogButton} from 'ui/UiDialogButton';
import {useState} from 'react';
import {AddPreuve, TAddPreuveProps} from './AddPreuve';

/**
 * Affiche le panneau "preuves" d'une action
 */
export const AddPreuveButton = (props: TAddPreuveProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <UiDialogButton
      buttonLabel="+ Ajouter"
      title="Ajouter une preuve"
      buttonClasses="fr-btn--secondary fr-btn--sm"
      opened={opened}
      setOpened={setOpened}
    >
      <AddPreuve {...props} />
    </UiDialogButton>
  );
};
