import { PreuvesAction } from '@/app/referentiels/preuves/PreuvesAction';
import {
  TActionDef,
  usePreuvesParType,
} from '@/app/referentiels/preuves/usePreuves';
import { ComponentPropsWithoutRef } from 'react';

export interface TActionPreuvePanelProps
  extends ComponentPropsWithoutRef<'div'> {
  /** Identifiant de l'action ou de la sous-action concernée */
  action: TActionDef;
  /** indique si les preuves associées aux sous-actions sont également chargées */
  withSubActions?: boolean;
  /** indique si l'avertissement "toutes les preuves ajoutées seront
   * visibles..." doit être affiché */
  showWarning?: boolean;
  /** indique si l'identifiant de l'action doit être masqué */
  hideIdentifier?: boolean;
  /** désactive le fetch si renseigné */
  disableFetch?: boolean;
  /** Affichage sur une colonne pour les preuves dans le panneau latéral */
  displayInPanel?: boolean;
}

/**
 * Affiche le panneau "preuves" d'une action
 */
const ActionPreuvePanel = (props: TActionPreuvePanelProps) => {
  const {
    action,
    withSubActions,
    showWarning,
    hideIdentifier,
    disableFetch,
    displayInPanel,
    ...otherProps
  } = props;
  const { reglementaire, complementaire } = usePreuvesParType({
    action,
    withSubActions,
    disabled: disableFetch,
  });

  return (
    <PreuvesAction
      action={action}
      withSubActions={withSubActions}
      reglementaires={reglementaire || []}
      complementaires={complementaire || []}
      showWarning={showWarning}
      hideIdentifier={hideIdentifier}
      displayInPanel={displayInPanel}
      {...otherProps}
    />
  );
};

export default ActionPreuvePanel;
