import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import classNames from 'classnames';
import SubActionTask from './sub-action-task';

type SubActionTasksListProps = {
  tasks: ActionDefinitionSummary[];
  hideStatus?: boolean;
  className?: string;
};

/**
 * Liste des tâches associées à une sous-action
 */

const SubActionTasksList = ({
  tasks,
  hideStatus = false,
  className,
}: SubActionTasksListProps): JSX.Element => {
  return (
    <div className={classNames('flex flex-col gap-5', className)}>
      {tasks.map((task) => (
        <SubActionTask key={task.id} task={task} hideStatus={hideStatus} />
      ))}
    </div>
  );
};

export default SubActionTasksList;
