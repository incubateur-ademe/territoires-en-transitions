import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import classNames from 'classnames';
import { JSX } from 'react';
import { ActionJustificationField } from '../action/action.justification-field';
import TaskCard from './task-card';

type TasksListProps = {
  subActionId?: string;
  tasks: ActionDefinitionSummary[];
  hideStatus?: boolean;
  shouldShowJustifications?: boolean;
  className?: string;
};

/**
 * Liste des tâches associées à une sous-action
 */

const TaskCardsList = ({
  subActionId,
  tasks,
  hideStatus = false,
  shouldShowJustifications = true,
  className,
}: TasksListProps): JSX.Element => {
  return (
    <div>
      {shouldShowJustifications && subActionId && (
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
            showJustifications={shouldShowJustifications}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskCardsList;
