import {Dialog} from '@material-ui/core';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useState} from 'react';
import {CloseDialogButton} from 'ui/shared/CloseDialogButton';
import {AddPreuve} from './AddPreuve';

export type TAddPreuveButtonProps = {
  action: ActionDefinitionSummary;
};

/**
 * Affiche le panneau "preuves" d'une action
 */
export const AddPreuveButton = (props: TAddPreuveButtonProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <div onClick={event => event.stopPropagation()}>
      <button
        data-test="AddPreuveButton"
        className="fr-btn fr-btn--sm"
        onClick={e => {
          e.preventDefault();
          setOpened(true);
        }}
      >
        +&nbsp;Ajouter
      </button>
      <Dialog
        data-test="AddPreuveDlg"
        open={opened}
        onClose={() => setOpened(false)}
        maxWidth="md"
        fullWidth={true}
      >
        <div className="p-7 flex flex-col items-center">
          <CloseDialogButton setOpened={setOpened} />
          <h3 className="pb-4">Ajouter une preuve</h3>
          <div className="w-full">
            <AddPreuve {...props} onClose={() => setOpened(false)} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
