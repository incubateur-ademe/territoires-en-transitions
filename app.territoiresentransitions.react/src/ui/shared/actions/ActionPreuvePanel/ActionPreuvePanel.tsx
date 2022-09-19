import {usePreuvesParType} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {PreuvesAction} from 'ui/shared/preuves/Bibliotheque/PreuvesAction';

export type TActionPreuvePanelProps = {
  action_id: string;
};

/**
 * Affiche le panneau "preuves" d'une action
 */
export default (props: TActionPreuvePanelProps) => {
  const {action_id} = props;
  const {reglementaire, complementaire} = usePreuvesParType({
    action_id,
  });

  return (
    <PreuvesAction
      action_id={action_id}
      reglementaires={reglementaire || []}
      complementaires={complementaire || []}
      showWarning
    />
  );
};
