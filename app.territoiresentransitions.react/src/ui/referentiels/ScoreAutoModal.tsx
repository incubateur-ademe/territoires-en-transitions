import {SuiviScoreRow} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useScoreRealise';
import SubActionTasksList from 'app/pages/collectivite/EtatDesLieux/Referentiel/SuiviAction/SubActionTasksList';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {useTasksStatus} from 'core-logic/hooks/useActionStatut';
import {Dispatch, SetStateAction, useState} from 'react';
import {TActionAvancement} from 'types/alias';
import Modal from 'ui/shared/floating-ui/Modal';
import {StatusToSavePayload} from './ActionStatusDropdown';
import {Alert} from '@tet/ui';

/**
 * Vérifie pour chaque tâche de la sous-action le statut
 * en base et le statut en cours de modification
 * Toutes les tâches doivent avoir un statut différent de 'non renseigné'
 */
const isCustomScoreGranted = (
  tasks: ActionDefinitionSummary[],
  tasksStatus: {
    [key: string]: {avancement: TActionAvancement; concerne: boolean};
  },
  localStatus: {
    [key: string]: StatusToSavePayload;
  }
) => {
  const isGranted = tasks.reduce((result, currTask) => {
    if (
      (!!tasksStatus[currTask.id] &&
        tasksStatus[currTask.id].avancement === 'non_renseigne' &&
        tasksStatus[currTask.id].concerne) ||
      !tasksStatus[currTask.id]
    ) {
      // Si la tâche est à 'non renseigné' ou n'a pas de statut attribué
      // -> On vérifie que le statut soit renseigné localement
      if (
        !!localStatus[currTask.id] &&
        localStatus[currTask.id].avancement !== 'non_renseigne'
      ) {
        return result;
      } else return false;
    } else {
      // Si la tâche est à un statut différent de 'non renseigné'
      // -> On vérifie que le statut local n'ait pas été changé à 'non renseigné'
      if (
        !!localStatus[currTask.id] &&
        localStatus[currTask.id].avancement === 'non_renseigne'
      ) {
        return false;
      } else return result;
    }
  }, true);

  return isGranted;
};

type ScoreAutoModalProps = {
  action: ActionDefinitionSummary;
  actionScores: {[actionId: string]: SuiviScoreRow};
  externalOpen: boolean;
  setExternalOpen: Dispatch<SetStateAction<boolean>>;
  onSaveScore: (payload: StatusToSavePayload[]) => void;
  onOpenScorePerso?: () => void;
};

const ScoreAutoModal = ({
  action,
  actionScores,
  externalOpen,
  setExternalOpen,
  onSaveScore,
  onOpenScorePerso,
}: ScoreAutoModalProps): JSX.Element => {
  const tasks = useActionSummaryChildren(action);

  const {tasksStatus} = useTasksStatus(tasks.map(task => task.id));

  const [localStatus, setLocalStatus] = useState<{
    [key: string]: StatusToSavePayload;
  }>({});
  const handleChangeStatus = (payload: StatusToSavePayload) => {
    setLocalStatus(prevState => ({
      ...prevState,
      [payload.actionId]: {
        actionId: payload.actionId,
        statut: payload.statut,
        avancement: payload.avancement,
        avancementDetaille: payload.avancementDetaille,
      },
    }));
  };

  const handleSaveScoreAuto = () => {
    let newStatus = [];

    for (const actionId in localStatus) {
      newStatus.push({
        actionId,
        statut: localStatus[actionId].statut,
        avancement: localStatus[actionId].avancement,
        avancementDetaille: localStatus[actionId].avancementDetaille,
      });
    }

    onSaveScore(newStatus);
  };

  return (
    <Modal
      size="xl"
      externalOpen={externalOpen}
      setExternalOpen={setExternalOpen}
      render={() => {
        return (
          <>
            <h4>Détailler l'avancement : {action.id.split('_')[1]}</h4>

            <hr className="p-1" />

            <div className="w-full -mt-1">
              <SubActionTasksList
                tasks={tasks}
                actionScores={actionScores}
                onSaveStatus={handleChangeStatus}
              />

              {action.referentiel === 'cae' &&
                !isCustomScoreGranted(tasks, tasksStatus, localStatus) && (
                  <Alert
                    state="warning"
                    className="my-12"
                    title="Pour activer l’ajustement manuel, vous devez renseigner un
                  statut pour chaque tâche."
                  />
                )}

              <div className="w-full flex justify-end gap-4 mt-12 mb-4">
                {action.referentiel === 'eci' && (
                  <button
                    className="fr-btn fr-btn--secondary"
                    onClick={() => setExternalOpen(false)}
                  >
                    Annuler
                  </button>
                )}
                <button className="fr-btn" onClick={handleSaveScoreAuto}>
                  {action.referentiel === 'eci'
                    ? 'Enregistrer ce score'
                    : 'Enregistrer le score automatique'}
                </button>
                {action.referentiel === 'cae' && (
                  <button
                    onClick={() => {
                      if (JSON.stringify(localStatus) !== '{}')
                        handleSaveScoreAuto(); // Sauvegarde du score auto s'il y a eu des modifications
                      if (onOpenScorePerso) onOpenScorePerso();
                      setExternalOpen(false);
                    }}
                    disabled={
                      !isCustomScoreGranted(tasks, tasksStatus, localStatus)
                    }
                    className="fr-btn fr-btn--secondary fr-btn--icon-right fr-icon-arrow-right-line"
                  >
                    Personnaliser ce score
                  </button>
                )}
              </div>
            </div>
          </>
        );
      }}
    />
  );
};

export default ScoreAutoModal;
