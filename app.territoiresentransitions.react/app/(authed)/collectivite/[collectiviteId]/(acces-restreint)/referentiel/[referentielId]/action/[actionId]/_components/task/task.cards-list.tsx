import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { Checkbox, Divider } from '@/ui';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import ActionJustificationField from '../action/action.justification-field';
import TaskCard from './task-card';

type TasksListProps = {
  subActionId?: string;
  tasks: ActionDefinitionSummary[];
  hideStatus?: boolean;
  displayJustificationCheckbox?: boolean;
  shouldShowJustifications?: boolean;
  setShouldShowJustifications?: (value: boolean) => void;
  className?: string;
};

/**
 * Liste des tâches associées à une sous-action
 */

const TaskCardsList = ({
  subActionId,
  tasks,
  hideStatus = false,
  displayJustificationCheckbox = false,
  shouldShowJustifications,
  setShouldShowJustifications,
  className,
}: TasksListProps): JSX.Element => {
  const [showJustifications, setShowJustififcations] = useState(
    shouldShowJustifications ?? true
  );

  useEffect(() => {
    setShowJustififcations(shouldShowJustifications ?? true);
  }, [shouldShowJustifications]);

  return (
    <div>
      {displayJustificationCheckbox && (
        <div className="flex flex-col">
          {/* Affichage des justifications */}
          <Checkbox
            variant="switch"
            label="Afficher l’état d’avancement"
            labelClassname="text-grey-7"
            checked={showJustifications}
            onChange={(evt) => {
              setShowJustififcations(evt.currentTarget.checked);
              setShouldShowJustifications?.(evt.currentTarget.checked);
            }}
          />

          <Divider color="grey" className="mt-6" />
        </div>
      )}

      {showJustifications && subActionId && (
        <ActionJustificationField
          actionId={subActionId}
          title="Explications sur l'état d'avancement :"
          className="min-h-20"
          fieldClassName="min-h-20 mb-4"
        />
      )}

      <div className={classNames('flex flex-col gap-4', className)}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            hideStatus={hideStatus}
            showJustifications={showJustifications}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskCardsList;
