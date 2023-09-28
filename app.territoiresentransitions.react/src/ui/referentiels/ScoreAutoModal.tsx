import {SuiviScoreRow} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useScoreRealise';
import SubActionTasksList from 'app/pages/collectivite/EtatDesLieux/Referentiel/SuiviAction/SubActionTasksList';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {useTasksStatus} from 'core-logic/hooks/useActionStatut';
import {Dispatch, SetStateAction, useState} from 'react';
import Modal from 'ui/shared/floating-ui/Modal';
import {StatusToSavePayload} from './ActionStatusDropdown';

type ScoreAutoModalProps = {
  action: ActionDefinitionSummary;
  actionScores: {[actionId: string]: SuiviScoreRow};
  externalOpen: boolean;
  setExternalOpen: Dispatch<SetStateAction<boolean>>;
  onSaveScore: (payload: StatusToSavePayload[]) => void;
  onClose: () => void;
};

const ScoreAutoModal = ({
  action,
  actionScores,
  externalOpen,
  setExternalOpen,
  onSaveScore,
  onClose,
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

  const isCustomScoreGranted = () => {
    const isGranted = tasks.reduce((result, currTask) => {
      if (
        (!!tasksStatus[currTask.id] &&
          tasksStatus[currTask.id] === 'non_renseigne') ||
        !tasksStatus[currTask.id]
      ) {
        if (
          !!localStatus[currTask.id] &&
          localStatus[currTask.id].avancement !== 'non_renseigne'
        ) {
          return result;
        } else return false;
      } else {
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

  return (
    <Modal
      size="xl"
      externalOpen={externalOpen}
      setExternalOpen={setExternalOpen}
      render={() => {
        return (
          <>
            <h4>Détailler l'avancement : {action.id.split('_')[1]}</h4>

            <div className="w-full py-6">
              <SubActionTasksList
                tasks={tasks}
                actionScores={actionScores}
                onSaveStatus={handleChangeStatus}
              />

              <hr />

              {!isCustomScoreGranted() && (
                <div className="fr-alert fr-alert--warning mt-6 mb-12">
                  <p>
                    Pour activer l’ajustement manuel, vous devez renseigner un
                    statut pour chaque tâche.
                  </p>
                </div>
              )}

              <div className="w-full flex justify-end gap-4 mt-6">
                {action.referentiel === 'eci' && (
                  <button
                    className="fr-btn fr-btn--secondary"
                    onClick={onClose}
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
                    disabled={!isCustomScoreGranted()}
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
