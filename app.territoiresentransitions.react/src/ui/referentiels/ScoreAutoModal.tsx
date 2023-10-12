import {avancementToLabel} from 'app/labels';
import {SuiviScoreRow} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useScoreRealise';
import {useTasksScoreRepartition} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useTasksScores';
import SubActionTasksList from 'app/pages/collectivite/EtatDesLieux/Referentiel/SuiviAction/SubActionTasksList';
import {actionAvancementColors} from 'app/theme';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {useTasksStatus} from 'core-logic/hooks/useActionStatut';
import {Dispatch, SetStateAction, useState} from 'react';
import {ActionScore} from 'types/ClientScore';
import ProgressBarWithTooltip from 'ui/score/ProgressBarWithTooltip';
import Modal from 'ui/shared/floating-ui/Modal';
import {StatusToSavePayload} from './ActionStatusDropdown';
import {getStatusFromIndex} from './utils';

/**
 * Vérifie pour chaque tâche de la sous-action le statut
 * en base et le statut en cours de modification
 * Toutes les tâches doivent avoir un statut différent de 'non renseigné'
 */
const isCustomScoreGranted = (
  tasks: ActionDefinitionSummary[],
  tasksStatus: {
    [key: string]:
      | 'fait'
      | 'pas_fait'
      | 'programme'
      | 'non_renseigne'
      | 'detaille';
  },
  localStatus: {
    [key: string]: StatusToSavePayload;
  }
) => {
  const isGranted = tasks.reduce((result, currTask) => {
    if (
      (!!tasksStatus[currTask.id] &&
        tasksStatus[currTask.id] === 'non_renseigne') ||
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

/**
 * Calcul pour une tâche donnée du nouveau score détaillé
 * en fonction du statut choisi dans la modale
 */
const getNewTaskScores = (task: ActionScore, payload: StatusToSavePayload) => {
  let taskScores = {
    point_fait: 0,
    point_programme: 0,
    point_pas_fait: 0,
  };

  switch (payload.avancement) {
    case 'fait':
    case 'programme':
    case 'pas_fait':
      taskScores[`point_${payload.avancement}`] = task.point_potentiel;
      break;
    case 'detaille':
      if (payload.avancementDetaille) {
        taskScores.point_fait =
          task.point_potentiel * payload.avancementDetaille[0];
        taskScores.point_programme =
          task.point_potentiel * payload.avancementDetaille[1];
        taskScores.point_pas_fait =
          task.point_potentiel * payload.avancementDetaille[2];
      }
      break;
    default:
      break;
  }

  return taskScores;
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
  const scores = useTasksScoreRepartition(action.id);

  const {tasksStatus} = useTasksStatus(tasks.map(task => task.id));

  const [localStatus, setLocalStatus] = useState<{
    [key: string]: StatusToSavePayload;
  }>({});
  const [localTasksScores, setLocalTasksScores] = useState<{
    [key: string]: {
      point_fait: number;
      point_programme: number;
      point_pas_fait: number;
    };
  }>({});
  const [localAvancement, setLocalAvancement] = useState(
    scores.avancementDetaille
  );

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

    // Calcul de la jauge de score auto en fonction
    // des modifications faites dans la modale
    // en passant en revue toutes les tâches de la sous-action
    let scoreFait = 0;
    let scoreProgramme = 0;
    let scorePasFait = 0;

    scores.tasksScores.forEach(task => {
      if (
        task.action_id !== payload.actionId &&
        !localTasksScores[task.action_id]
      ) {
        // La tâche n'est pas celle modifiée dans la payload
        // et n'a pas été modifiée dans la modale
        // -> score stocké en base
        scoreFait += task.point_fait;
        scoreProgramme += task.point_programme;
        scorePasFait += task.point_pas_fait;
      } else if (
        task.action_id !== payload.actionId &&
        localTasksScores[task.action_id]
      ) {
        // La tâche n'est pas celle modifiée dans la payload
        // mais a été modifiée dans la modale
        // -> score stocké localement
        scoreFait += localTasksScores[task.action_id].point_fait;
        scoreProgramme += localTasksScores[task.action_id].point_programme;
        scorePasFait += localTasksScores[task.action_id].point_pas_fait;
      } else {
        // La tâche est celle modifiée dans la payload
        // -> calcul du nouveau score de la tâche
        const newScores = getNewTaskScores(task, payload);
        scoreFait += newScores.point_fait;
        scoreProgramme += newScores.point_programme;
        scorePasFait += newScores.point_pas_fait;
        setLocalTasksScores(prevState => ({
          ...prevState,
          [task.action_id]: {...newScores},
        }));
      }
    });

    setLocalAvancement([scoreFait, scoreProgramme, scorePasFait]);
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

            {scores && scores.scoreMax && localAvancement && (
              <div className="flex items-start mt-2 mb-6">
                <p className="mb-0 text-sm mr-4">
                  Score {action.referentiel === 'cae' ? 'automatique' : ''}
                </p>
                <ProgressBarWithTooltip
                  score={
                    localAvancement?.map((a, idx) => ({
                      value: a,
                      label: avancementToLabel[getStatusFromIndex(idx)],
                      color: actionAvancementColors[getStatusFromIndex(idx)],
                    })) ?? []
                  }
                  total={scores.scoreMax ?? 0}
                  defaultScore={{
                    label: avancementToLabel.non_renseigne,
                    color: actionAvancementColors.non_renseigne,
                  }}
                  valueToDisplay={avancementToLabel.fait}
                />
              </div>
            )}

            <hr className="p-1" />

            <div className="w-full -mt-1">
              <SubActionTasksList
                tasks={tasks}
                actionScores={actionScores}
                onSaveStatus={handleChangeStatus}
              />

              {action.referentiel === 'cae' &&
                !isCustomScoreGranted(tasks, tasksStatus, localStatus) && (
                  <div className="fr-alert fr-alert--warning mt-12 mb-12">
                    <p>
                      Pour activer l’ajustement manuel, vous devez renseigner un
                      statut pour chaque tâche.
                    </p>
                  </div>
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
