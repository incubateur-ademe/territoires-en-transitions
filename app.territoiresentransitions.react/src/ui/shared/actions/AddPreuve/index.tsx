import {Dialog} from '@material-ui/core';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useState} from 'react';
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
        open={opened}
        onClose={() => setOpened(false)}
        maxWidth="md"
        fullWidth={true}
      >
        <div className="p-7 flex flex-col items-center">
          <a
            className="fr-link fr-fi-close-line fr-link--icon-right self-end"
            href="#"
            onClick={e => {
              e.preventDefault();
              setOpened(false);
            }}
          >
            Fermer
          </a>
          <h3 className="text-center pb-4">Ajouter une preuve</h3>
          <div className="w-full">
            <AddPreuve {...props} onClose={() => setOpened(false)} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};
