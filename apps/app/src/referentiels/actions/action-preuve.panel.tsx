import { appLabels } from '@/app/labels/catalog';
import { useListDocumentsMesure } from '@/app/referentiels/preuves/data/use-list-documents-mesure';
import { PreuvesAction } from '@/app/referentiels/preuves/PreuvesAction';
import { ActionIdentity } from './use-list-actions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert } from '@tet/ui';
import { ComponentPropsWithoutRef } from 'react';

export interface TActionPreuvePanelProps
  extends ComponentPropsWithoutRef<'div'> {
  /** Identifiant de l'action ou de la sous-action concernée */
  action: ActionIdentity;
  /** indique si les preuves associées aux sous-actions sont également chargées */
  withSubActions?: boolean;
  /** indique si l'avertissement "toutes les preuves ajoutées seront
   * visibles..." doit être affiché */
  showWarning?: boolean;
  /** indique si l'identifiant de l'action doit être masqué */
  hideIdentifier?: boolean;
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
    displayInPanel,
    ...otherProps
  } = props;
  const collectiviteId = useCollectiviteId();
  const documents = useListDocumentsMesure({
    collectiviteId,
    actionId: action.actionId,
    withSubActions,
  });

  if (documents.status === 'loading') {
    return <SpinnerLoader className="m-auto" />;
  }

  if (documents.status === 'error') {
    return <Alert state="error" title={appLabels.erreurChargementDocuments} />;
  }

  return (
    <PreuvesAction
      action={action}
      withSubActions={withSubActions}
      attendus={documents.attendus}
      complementaires={documents.complementaires}
      showWarning={showWarning}
      hideIdentifier={hideIdentifier}
      displayInPanel={displayInPanel}
      {...otherProps}
    />
  );
};

export default ActionPreuvePanel;
