import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { StatusToSavePayload } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import SubActionTask from './sub-action-task';

type SubActionTasksListProps = {
  tasks: ActionDefinitionSummary[];
  hideStatus?: boolean;
  statusWarningMessage?: boolean;
  onSaveStatus?: (payload: StatusToSavePayload) => void;
};

/**
 * Liste des tâches associées à une sous-action
 */

const SubActionTasksList = ({
  tasks,
  hideStatus = false,
  statusWarningMessage = false,
  onSaveStatus,
}: SubActionTasksListProps): JSX.Element => {
  return (
    <div className="divide-y divide-[#ddd]">
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
