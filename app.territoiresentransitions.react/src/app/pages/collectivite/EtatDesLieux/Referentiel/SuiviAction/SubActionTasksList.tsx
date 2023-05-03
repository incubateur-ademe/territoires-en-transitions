import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import SubActionTask from './SubActionTask';

type SubActionTasksListProps = {
  tasks: ActionDefinitionSummary[];
};

/**
 * Liste des tâches associées à une sous-action
 */

const SubActionTasksList = ({tasks}: SubActionTasksListProps): JSX.Element => {
  return (
    <div className="divide-y">
      {tasks.map(task => (
        <SubActionTask key={task.id} task={task} />
      ))}
    </div>
  );
};

export default SubActionTasksList;
