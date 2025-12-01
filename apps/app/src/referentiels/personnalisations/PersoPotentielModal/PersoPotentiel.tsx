import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import Modal from '@/app/ui/shared/floating-ui/Modal';
import { useCollectiviteId } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Button } from '@tet/ui';
import { useQuestionsReponses } from '../PersoReferentielThematique/useQuestionsReponses';
import { PersoPotentielTabs } from './PersoPotentielTabs';
import { PointsPotentiels } from './points-potentiels.label';
import { useChangeReponseHandler } from './useChangeReponseHandler';
import { useRegles } from './useRegles';

export type TPersoPotentielButtonProps = {
  /** Définition de l'action */
  actionDef: ActionDefinitionSummary;
};

/**
 * Affiche le potentiel de points (éventuellement réduit/augmenté), ainsi que le
 * bouton permettant d'ouvrir le dialogue "personnaliser le potentiel de points"
 * d'une action, et le dialogue lui-même
 */
export const PersoPotentiel = ({ actionDef }: TPersoPotentielButtonProps) => {
  const { id: actionId, type, identifiant, nom } = actionDef;
  const collectiviteId = useCollectiviteId();
  const qr = useQuestionsReponses({ action_ids: [actionId] });
  const regles = useRegles(actionId);
  const handleChange = useChangeReponseHandler(collectiviteId, [
    getReferentielIdFromActionId(actionId),
  ]);

  return (
    <div
      data-test="PersoPotentiel"
      className="flex items-center"
      onClick={(event) => event.stopPropagation()}
    >
      <PointsPotentiels actionId={actionId} />

      <Modal
        size="lg"
        render={() => (
          <div className="p-7 flex flex-col" data-test="PersoPotentielDlg">
            <h3>Personnaliser le potentiel de points</h3>
            <span className="mb-6 font-bold">
              {type[0].toUpperCase() + type.slice(1)} {identifiant} : {nom}
            </span>
            <div className="w-full">
              {qr && collectiviteId ? (
                <PersoPotentielTabs
                  actionDef={actionDef}
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
