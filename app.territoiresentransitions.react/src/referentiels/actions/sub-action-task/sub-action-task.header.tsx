import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { SubActionStatutDropdown } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import Markdown from '@/app/ui/Markdown';
import { Button, InfoTooltip } from '@/ui';
import { useState } from 'react';
import ScoreProgressBar from '../../scores/score.progress-bar';
import {
  useActionStatut,
  useEditActionStatutIsDisabled,
} from '../action-statut/use-action-statut';

type TaskHeaderProps = {
  task: ActionDefinitionSummary;
  hideStatus: boolean;
};

const TaskHeader = ({ task, hideStatus }: TaskHeaderProps) => {
  const [openScoreDetaille, setOpenScoreDetaille] = useState(false);

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
              openScoreDetailleState={{
                isOpen: openScoreDetaille,
                setIsOpen: setOpenScoreDetaille,
              }}
            />
          </div>
        )}
      </div>

      {/* Deuxième ligne (optionnelle) : jauge + cta détailler l'avancement */}
      {statut?.avancement === 'detaille' && !hideStatus && (
        <div className="flex justify-between">
          <ScoreProgressBar
            id={task.id}
            identifiant={task.identifiant}
            type={task.type}
            displayDoneValue
            valuePosition="right"
            className="w-full max-w-60"
          />

          {!disabled && (
            <Button
              variant="underlined"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setOpenScoreDetaille(true);
              }}
            >
              Détailler l&apos;avancement
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskHeader;
