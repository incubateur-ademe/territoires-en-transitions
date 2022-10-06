import {
  TActionDef,
  usePreuvesParType,
} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {PreuvesAction} from 'ui/shared/preuves/Bibliotheque/PreuvesAction';

export type TActionPreuvePanelProps = {
  /** Identifiant de l'action ou de la sous-action concernée */
  action: TActionDef;
  /** indique si les preuves associées aux sous-actions sont également chargées */
  withSubActions?: boolean;
  /** indique si l'avertissement "toutes les preuves ajoutées seront
   * visibles..." doit être affiché */
  showWarning?: boolean;
  /** indique si l'identifiant de l'action doit être masqué */
  noIdentifiant?: boolean;
};

/**
 * Affiche le panneau "preuves" d'une action
 */
const ActionPreuvePanel = (props: TActionPreuvePanelProps) => {
  const {action, withSubActions, showWarning, noIdentifiant} = props;
  const {reglementaire, complementaire} = usePreuvesParType({
    action,
    withSubActions,
  });

  return (
    <PreuvesAction
      action={action}
      withSubActions={withSubActions}
      reglementaires={reglementaire || []}
      complementaires={complementaire || []}
      showWarning={showWarning}
      noIdentifiant={noIdentifiant}
    />
  );
};

export default ActionPreuvePanel;
