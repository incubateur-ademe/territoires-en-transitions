import { ActionDefinitionSummary } from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { PersoPotentielTabs } from './PersoPotentielTabs';
import { PointsPotentiels } from './PointsPotentiels';
import { useRegles } from './useRegles';
import { useChangeReponseHandler } from './useChangeReponseHandler';
import { useActionScore } from 'core-logic/hooks/scoreHooks';
import { useQuestionsReponses } from '../PersoReferentielThematique/useQuestionsReponses';
import Modal from 'ui/shared/floating-ui/Modal';
import { Button } from '@tet/ui';

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
  const { id: actionId, type, identifiant, nom } = props.actionDef;
  const collectivite_id = useCollectiviteId();
  const qr = useQuestionsReponses({ action_ids: [actionId] });
  const regles = useRegles(actionId);
  const handleChange = useChangeReponseHandler(collectivite_id);

  const actionScore = useActionScore(actionId);
  if (!actionScore) {
    return null;
  }

  return (
    <div
      data-test="PersoPotentiel"
      className="flex items-center"
      onClick={(event) => event.stopPropagation()}
    >
      <PointsPotentiels actionScore={actionScore} />
      <Modal
        size="lg"
        render={() => (
          <div className="p-7 flex flex-col" data-test="PersoPotentielDlg">
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
        )}
      >
        <Button
          className="ml-2"
          variant="underlined"
          size="sm"
          icon="settings-5-line"
        >
          Personnaliser
        </Button>
      </Modal>
    </div>
  );
};
