import {usePreuvesParType} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {PreuvesAction} from 'ui/shared/preuves/Bibliotheque/PreuvesAction';

export type TActionPreuvePanelProps = {
  /** Identifiant de l'action (ou de la sous-action concernée). Si l'id se
   * termine par "%" il s'agit du cas "action et ses sous-actions"
   */
  action_id: string;
  /** indique si l'avertissement "toutes les preuves ajoutées seront
   * visibles..." doit être affiché */
  showWarning?: boolean;
  /** indique si l'identifiant de l'action doit être masqué */
  noIdentifiant?: boolean;
};

/**
 * Affiche le panneau "preuves" d'une action
 */
export default (props: TActionPreuvePanelProps) => {
  const {action_id, showWarning, noIdentifiant} = props;
  const {reglementaire, complementaire} = usePreuvesParType({
    action_id,
  });

  return (
    <PreuvesAction
      action_id={action_id}
      reglementaires={reglementaire || []}
      complementaires={complementaire || []}
      showWarning={showWarning}
      noIdentifiant={noIdentifiant}
    />
  );
};
