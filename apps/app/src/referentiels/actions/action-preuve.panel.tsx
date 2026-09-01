import { appLabels } from '@/app/labels/catalog';
import { useListMesureDocuments } from '@/app/referentiels/preuves/data/use-list-mesure-documents';
import { PreuvesAction } from '@/app/referentiels/preuves/PreuvesAction';
import { ActionDef } from './use-list-actions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert } from '@tet/ui';
import { ComponentPropsWithoutRef } from 'react';

export interface TActionPreuvePanelProps
  extends ComponentPropsWithoutRef<'div'> {
  /** Identifiant de l'action ou de la sous-action concernée */
  action: ActionDef;
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
  const collectiviteId = useCollectiviteId();
  const documentsQuery = useListMesureDocuments({
    collectiviteId,
    actionId: action.actionId,
    withSubActions,
    disabled: disableFetch,
  });

  if (documentsQuery.status === 'loading') {
    return <SpinnerLoader className="m-auto" />;
  }

  if (documentsQuery.status === 'error') {
    return <Alert state="error" title={appLabels.erreurChargementDocuments} />;
  }

  return (
    <PreuvesAction
      action={action}
      withSubActions={withSubActions}
      attendus={documentsQuery.attendus}
      complementaires={documentsQuery.complementaires}
      showWarning={showWarning}
      hideIdentifier={hideIdentifier}
      displayInPanel={displayInPanel}
      {...otherProps}
    />
  );
};

export default ActionPreuvePanel;
