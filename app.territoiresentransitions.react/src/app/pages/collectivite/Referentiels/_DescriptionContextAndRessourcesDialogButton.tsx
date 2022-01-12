import {useState} from 'react';
import Dialog from '@material-ui/core/Dialog';
import {
  ActionContexteExpandPanel,
  ActionExemplesExpandPanel,
  ActionRessourcesExpandPanel,
} from 'ui/shared/actions/ActionExpandPanels';
import {ActionReferentiel} from 'types/action_referentiel';

const ContexteExemplesAndRessourcesDialogContent = ({
  action,
}: {
  action: ActionReferentiel;
}) => (
  <div className="p-7 flex flex-col">
    <h4 className="pb-4"> {action.nom} </h4>
    <ActionContexteExpandPanel action={action} />
    <ActionExemplesExpandPanel action={action} />
    <ActionRessourcesExpandPanel action={action} />
  </div>
);

export const DescriptionContextAndRessourcesDialogButton = ({
  action,
}: {
  action: ActionReferentiel;
}) => {
  const [opened, setOpened] = useState(false);

  return (
    <div>
      <button
        className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-information-fill fr-btn--icon-left"
        onClick={() => setOpened(true)}
      >
        Contexte, exemples et ressources
      </button>
      <Dialog
        open={opened}
        onClose={() => setOpened(false)}
        maxWidth="md"
        fullWidth={true}
      >
        <ContexteExemplesAndRessourcesDialogContent action={action} />
      </Dialog>
    </div>
  );
};
