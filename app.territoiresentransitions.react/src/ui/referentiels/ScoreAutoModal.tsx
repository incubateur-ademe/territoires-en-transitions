import {avancementToLabel} from 'app/labels';
import {SuiviScoreRow} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useScoreRealise';
import {useTasksScoreRepartition} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useTasksScores';
import SubActionTasksList from 'app/pages/collectivite/EtatDesLieux/Referentiel/SuiviAction/SubActionTasksList';
import {actionAvancementColors} from 'app/theme';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {useTasksStatus} from 'core-logic/hooks/useActionStatut';
import {Dispatch, SetStateAction, useState} from 'react';
import ProgressBarWithTooltip from 'ui/score/ProgressBarWithTooltip';
import Modal from 'ui/shared/floating-ui/Modal';
import {StatusToSavePayload} from './ActionStatusDropdown';
import {getStatusFromIndex} from './utils';

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

    let scoreFait = 0;
    let scoreProgramme = 0;
    let scorePasFait = 0;

    scores.tasksScores.forEach(task => {
      if (
        task.action_id !== payload.actionId &&
        !localTasksScores[task.action_id]
      ) {
        scoreFait += task.point_fait;
        scoreProgramme += task.point_programme;
        scorePasFait += task.point_pas_fait;
      } else if (
        task.action_id !== payload.actionId &&
        localTasksScores[task.action_id]
      ) {
        scoreFait += localTasksScores[task.action_id].point_fait;
        scoreProgramme += localTasksScores[task.action_id].point_programme;
        scorePasFait += localTasksScores[task.action_id].point_pas_fait;
      } else {
        switch (payload.avancement) {
          case 'fait':
            scoreFait += task.point_potentiel;
            break;
          case 'programme':
            scoreProgramme += task.point_potentiel;
            break;
          case 'pas_fait':
            scorePasFait += task.point_potentiel;
            break;
          case 'detaille':
            if (payload.avancementDetaille) {
              scoreFait += task.point_potentiel * payload.avancementDetaille[0];
              scoreProgramme +=
                task.point_potentiel * payload.avancementDetaille[1];
              scorePasFait +=
                task.point_potentiel * payload.avancementDetaille[2];
            }
            break;
          default:
            break;
        }

        setLocalTasksScores(prevState => ({
          ...prevState,
          [task.action_id]: {
            point_fait:
              payload.avancement === 'fait'
                ? task.point_potentiel
                : payload.avancement === 'detaille' &&
                  payload.avancementDetaille
                ? task.point_potentiel * payload.avancementDetaille[0]
                : 0,
            point_programme:
              payload.avancement === 'programme'
                ? task.point_potentiel
                : payload.avancement === 'detaille' &&
                  payload.avancementDetaille
                ? task.point_potentiel * payload.avancementDetaille[1]
                : 0,
            point_pas_fait:
              payload.avancement === 'pas_fait'
                ? task.point_potentiel
                : payload.avancement === 'detaille' &&
                  payload.avancementDetaille
                ? task.point_potentiel * payload.avancementDetaille[2]
                : 0,
          },
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

              {action.referentiel === 'cae' && !isCustomScoreGranted() && (
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
