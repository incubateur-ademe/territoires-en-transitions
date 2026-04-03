import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import classNames from 'classnames';
import { JSX } from 'react';
import TaskCard from './task-card';

type TasksListProps = {
  tasks: ActionListItem[];
  shouldShowJustifications?: boolean;
  className?: string;
};

/**
 * Liste des tâches associées à une sous-action
 */

const TaskCardsList = ({
  tasks,
  shouldShowJustifications = true,
  className,
}: TasksListProps): JSX.Element => {
  return (
    <div>
      <div className={classNames('flex flex-col gap-4', className)}>
        {tasks.map((task) => (
          <TaskCard
            key={task.actionId}
            task={task}
            showJustifications={shouldShowJustifications}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskCardsList;
