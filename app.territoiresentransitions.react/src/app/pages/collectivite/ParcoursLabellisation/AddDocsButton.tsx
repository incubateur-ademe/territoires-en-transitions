import {Dialog} from '@material-ui/core';
import {useState} from 'react';
import {CloseDialogButton} from 'ui/shared/CloseDialogButton';
import {AddDocs} from './AddDocs';

export type TAddDocsButtonProps = {
  parcours_id: string;
};

/**
 * Affiche le panneau "preuves" d'une action
 */
export const AddDocsButton = (props: TAddDocsButtonProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <button
        data-test="AddDocsButton"
        className="fr-btn fr-btn--sm fr-btn--secondary"
        onClick={e => {
          e.preventDefault();
          setOpened(true);
        }}
      >
        +&nbsp;Ajouter
      </button>
      <Dialog
        data-test="AddDocsDlg"
        open={opened}
        onClose={() => setOpened(false)}
        maxWidth="md"
        fullWidth={true}
      >
        <div className="p-7 flex flex-col items-center">
          <CloseDialogButton setOpened={setOpened} />
          <h3 className="pb-4">Ajouter un document</h3>
          <div className="w-full">
            <AddDocs {...props} onClose={() => setOpened(false)} />
          </div>
        </div>
      </Dialog>
    </>
  );
};
