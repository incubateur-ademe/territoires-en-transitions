import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {TActionAvancementExt} from 'types/alias';
import {SuiviScoreRow} from '../data/useScoreRealise';
import SubActionTask from './SubActionTask';

type SubActionTasksListProps = {
  tasks: ActionDefinitionSummary[];
  actionScores: {[actionId: string]: SuiviScoreRow};
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
  actionScores,
  hideStatus = false,
  onSaveStatus,
}: SubActionTasksListProps): JSX.Element => {
  return (
    <div className="divide-y divide-[#ddd]">
      {tasks.map(task => (
        <SubActionTask
          key={task.id}
          task={task}
          actionScores={actionScores}
          hideStatus={hideStatus}
          onSaveStatus={onSaveStatus}
        />
      ))}
    </div>
  );
};

export default SubActionTasksList;
