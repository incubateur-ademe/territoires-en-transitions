import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import { ActionId } from '@tet/domain/referentiels';
import classNames from 'classnames';
import { JSX } from 'react';
import TaskCard from './task-card';

type TasksListProps = {
  taskIds: ActionId[];
  shouldShowJustifications?: boolean;
  className?: string;
};

/**
 * Liste des tâches associées à une sous-action
 */

const TaskCardsList = ({
  taskIds,
  shouldShowJustifications = true,
  className,
}: TasksListProps): JSX.Element => {
  const { data: tasks = [] } = useListActions({ actionIds: taskIds });

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
