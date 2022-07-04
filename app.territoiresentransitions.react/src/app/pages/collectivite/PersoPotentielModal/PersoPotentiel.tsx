import {useState} from 'react';
import {observer} from 'mobx-react-lite';
import {Dialog} from '@material-ui/core';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {CloseDialogButton} from 'ui/shared/CloseDialogButton';
import {PersoPotentielTabs} from './PersoPotentielTabs';
import {PointsPotentiels} from './PointsPotentiels';
import {useQuestionsReponses} from './useQuestionsReponses';
import {useRegles} from './useRegles';
import {useChangeReponseHandler} from './useChangeReponseHandler';
import {useActionScore} from 'core-logic/observables/scoreHooks';

export type TPersoPotentielButtonProps = {
  /** Définition de l'action */
  actionDef: ActionDefinitionSummary;
};

/**
 * Affiche le potentiel de points (éventuellement réduit/augmenté), ainsi que le
 * bouton permettant d'ouvrir le dialogue "personnaliser le potentiel de points"
 * d'une action, et le dialogue lui-même
 */
export const PersoPotentiel = (props: TPersoPotentielButtonProps) => {
  const {id: actionId, type, identifiant, nom} = props.actionDef;
  const [opened, setOpened] = useState(false);
  const collectivite_id = useCollectiviteId();
  const [data, refetch] = useQuestionsReponses(actionId);
  const regles = useRegles(actionId);
  const [handleChange, renderToast] = useChangeReponseHandler(
    collectivite_id,
    refetch
  );
  const {qr} = data || {};

  const actionScore = useActionScore(actionId);
  if (!actionScore) {
    return null;
  }

  return (
    <div onClick={event => event.stopPropagation()}>
      <PointsPotentiels
        actionDef={props.actionDef}
        actionScore={actionScore}
        onEdit={() => setOpened(true)}
      />
      <Dialog
        data-test="PersoPotentielDlg"
        open={opened}
        onClose={() => setOpened(false)}
        maxWidth="md"
        fullWidth={true}
      >
        <div className="p-7 flex flex-col">
          <CloseDialogButton setOpened={setOpened} />
          <h3>Personnaliser le potentiel de points</h3>
          <span className="fr-text--md font-bold">
            {type[0].toUpperCase() + type.slice(1)} {identifiant} : {nom}
          </span>
          <div className="w-full">
            {qr && collectivite_id ? (
              <PersoPotentielTabs
                {...props}
                actionScore={actionScore}
                questionReponses={qr}
                regles={regles}
                onChange={handleChange}
              />
            ) : null}
          </div>
        </div>
      </Dialog>
      {renderToast()}
    </div>
  );
};
