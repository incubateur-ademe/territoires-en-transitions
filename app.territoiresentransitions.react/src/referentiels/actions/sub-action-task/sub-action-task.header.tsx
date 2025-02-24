import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import {
  StatusToSavePayload,
  SubActionStatutDropdown,
} from '@/app/referentiels/actions/sub-action-statut.dropdown';
import Markdown from '@/app/ui/Markdown';
import { Button, InfoTooltip } from '@/ui';
import { useState } from 'react';
import ProgressBarWithTooltip from '../../scores/progress-bar-with-tooltip';
import ScoreProgressBar from '../../scores/score.progress-bar';
import { getStatusFromIndex } from '../../utils';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
} from '../action-statut/use-action-statut';

type TaskHeaderProps = {
  task: ActionDefinitionSummary;
  hideStatus: boolean;
  statusWarningMessage: boolean;
  onSaveStatus?: (payload: StatusToSavePayload) => void;
};

const TaskHeader = ({
  task,
  hideStatus,
  statusWarningMessage,
  onSaveStatus,
}: TaskHeaderProps) => {
  const [openScoreDetaille, setOpenScoreDetaille] = useState(false);
  // localStatus permet de mettre à jour l'affichage lorsque pas de sauvegarde auto
  // comportement à revoir quand il n'y aura plus de modale pour l'édition des tâches
  const [localStatus, setLocalStatus] = useState<StatusToSavePayload | null>(
    null
  );

  const { statut } = useActionStatut(task.id);
  const disabled = useEditActionStatutIsDisabled(task.id);

  return (
    <div className="flex flex-col gap-2">
      {/* Première ligne : nom de la tâche + dropdown statut */}
      <div className="flex justify-between">
        {/* Identifiant + Nom + Description en tooltip */}
        <h6 className="text-base mb-0">
          {task.identifiant} {task.nom}{' '}
          {task.description && (
            <InfoTooltip
              label={
                <Markdown
                  content={task.description}
                  className="max-w-sm font-normal"
                />
              }
              activatedBy="click"
              iconClassName="ml-2"
            />
          )}
        </h6>

        {/* Dropdown du statut de la tâche */}
        {!hideStatus && (
          // Wrappé dans une div de taille fixe pour éviter les variations
          // de taille du nom de la tâche au changement de statut
          <div className="min-w-40 ml-auto">
            <SubActionStatutDropdown
              actionDefinition={task}
              statusWarningMessage={statusWarningMessage}
              openScoreDetailleState={{
                openScoreDetaille,
                setOpenScoreDetaille,
              }}
              onSaveStatus={
                onSaveStatus
                  ? (payload) => {
                      onSaveStatus(payload);
                      setLocalStatus(payload);
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Deuxième ligne (optionnelle) : jauge + cta détailler l'avancement */}
      {((!disabled &&
        statut?.avancement === 'detaille' &&
        localStatus === null) ||
        localStatus?.avancement === 'detaille') &&
        !hideStatus && (
          <div className="flex justify-between">
            {localStatus === null ? (
              <ScoreProgressBar
                actionDefinition={task}
                displayDoneValue
                valuePosition="right"
                className="w-full max-w-60"
              />
            ) : (
              <ProgressBarWithTooltip
                valuePosition="right"
                className="w-full max-w-60"
                score={
                  localStatus.avancementDetaille?.map((a, idx) => ({
                    value: a,
                    label: avancementToLabel[getStatusFromIndex(idx)],
                    color: actionAvancementColors[getStatusFromIndex(idx)],
                  })) ?? []
                }
                total={
                  localStatus.avancementDetaille?.reduce(
                    (sum, currValue) => sum + currValue
                  ) ?? 0
                }
                defaultScore={{
                  label: avancementToLabel.non_renseigne,
                  color: actionAvancementColors.non_renseigne,
                }}
                valueToDisplay={avancementToLabel.fait}
                percent
              />
            )}

            <Button
              variant="underlined"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setOpenScoreDetaille(true);
              }}
            >
              Détailler l'avancement
            </Button>
          </div>
        )}
    </div>
  );
};

export default TaskHeader;
