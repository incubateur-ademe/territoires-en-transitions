import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { StatusToSavePayload } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import classNames from 'classnames';
import SubActionTask from './sub-action-task';

type SubActionTasksListProps = {
  tasks: ActionDefinitionSummary[];
  hideStatus?: boolean;
  statusWarningMessage?: boolean;
  className?: string;
  onSaveStatus?: (payload: StatusToSavePayload) => void;
};

/**
 * Liste des tâches associées à une sous-action
 */

const SubActionTasksList = ({
  tasks,
  hideStatus = false,
  statusWarningMessage = false,
  className,
  onSaveStatus,
}: SubActionTasksListProps): JSX.Element => {
  return (
    <div className={classNames('flex flex-col gap-5', className)}>
      {tasks.map((task) => (
        <SubActionTask
          key={task.id}
          task={task}
          hideStatus={hideStatus}
          statusWarningMessage={statusWarningMessage}
          onSaveStatus={onSaveStatus}
        />
      ))}
    </div>
  );
};

export default SubActionTasksList;
