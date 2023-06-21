import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {TActionAvancementExt} from 'types/alias';
import SubActionTask from './SubActionTask';

type SubActionTasksListProps = {
  tasks: ActionDefinitionSummary[];
  hideStatus?: boolean;
  onSaveStatus?: (
    actionId: string,
    status: TActionAvancementExt,
    avancementDetaille?: number[]
  ) => void;
};

/**
 * Liste des tâches associées à une sous-action
 */

const SubActionTasksList = ({
  tasks,
  hideStatus = false,
  onSaveStatus,
}: SubActionTasksListProps): JSX.Element => {
  return (
    <div className="divide-y divide-[#ddd]">
      {tasks.map(task => (
        <SubActionTask
          key={task.id}
          task={task}
          hideStatus={hideStatus}
          onSaveStatus={onSaveStatus}
        />
      ))}
    </div>
  );
};

export default SubActionTasksList;
