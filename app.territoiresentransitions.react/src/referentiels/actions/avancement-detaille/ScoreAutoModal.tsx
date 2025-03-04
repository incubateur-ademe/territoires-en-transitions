import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import SubActionTasksList from '@/app/referentiels/actions/sub-action-task/sub-action-task.list';
import { useActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { StatutAvancement } from '@/domain/referentiels';
import { Alert, Button, Modal } from '@/ui';
import { Dispatch, SetStateAction, useState } from 'react';
import { useTasksStatus } from '../action-statut/use-action-statut';
import { StatusToSavePayload } from '../sub-action-statut.dropdown';

/**
 * Vérifie pour chaque tâche de la sous-action le statut
 * en base et le statut en cours de modification
 * Toutes les tâches doivent avoir un statut différent de 'non renseigné'
 */
const isCustomScoreGranted = (
  tasks: ActionDefinitionSummary[],
  tasksStatus: {
    [key: string]: { avancement: StatutAvancement; concerne: boolean };
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
  actionDefinition: ActionDefinitionSummary;
  externalOpen: boolean;
  setExternalOpen: Dispatch<SetStateAction<boolean>>;
  onSaveScore: (payload: StatusToSavePayload[]) => void;
  onOpenScorePerso?: () => void;
};

const ScoreAutoModal = ({
  actionDefinition: actionDefinition,
  externalOpen,
  setExternalOpen,
  onSaveScore,
  onOpenScorePerso,
}: ScoreAutoModalProps): JSX.Element => {
  const tasks = useActionSummaryChildren(actionDefinition);

  const { tasksStatus } = useTasksStatus(tasks.map((task) => task.id));

  const [localStatus, setLocalStatus] = useState<{
    [key: string]: StatusToSavePayload;
  }>({});
  const handleChangeStatus = (payload: StatusToSavePayload) => {
    setLocalStatus((prevState) => ({
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
    const newStatus = [];

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
      title="Détailler l'avancement"
      subTitle={`${actionDefinition.id.split('_')[1]} ${actionDefinition.nom}`}
      openState={{ isOpen: externalOpen, setIsOpen: setExternalOpen }}
      render={() => {
        return (
          <div className="w-full">
            <SubActionTasksList
              tasks={tasks}
              onSaveStatus={handleChangeStatus}
            />

            {actionDefinition.referentiel === 'cae' &&
              !isCustomScoreGranted(tasks, tasksStatus, localStatus) && (
                <Alert
                  state="warning"
                  className="my-12"
                  title="Pour activer l’ajustement manuel, vous devez renseigner un
                  statut pour chaque tâche."
                />
              )}

            <div className="w-full flex justify-end gap-4 mt-12 mb-4">
              {actionDefinition.referentiel === 'eci' && (
                <Button
                  onClick={() => setExternalOpen(false)}
                  variant="outlined"
                  size="sm"
                >
                  Annuler
                </Button>
              )}
              <Button onClick={handleSaveScoreAuto} size="sm">
                {actionDefinition.referentiel === 'eci'
                  ? 'Enregistrer ce score'
                  : 'Enregistrer le score automatique'}
              </Button>
              {actionDefinition.referentiel === 'cae' && (
                <Button
                  variant="outlined"
                  icon="arrow-right-line"
                  iconPosition="right"
                  onClick={() => {
                    if (JSON.stringify(localStatus) !== '{}')
                      handleSaveScoreAuto(); // Sauvegarde du score auto s'il y a eu des modifications
                    if (onOpenScorePerso) onOpenScorePerso();
                    setExternalOpen(false);
                  }}
                  disabled={
                    !isCustomScoreGranted(tasks, tasksStatus, localStatus)
                  }
                >
                  Personnaliser ce score
                </Button>
              )}
            </div>
          </div>
        );
      }}
    />
  );
};

export default ScoreAutoModal;
