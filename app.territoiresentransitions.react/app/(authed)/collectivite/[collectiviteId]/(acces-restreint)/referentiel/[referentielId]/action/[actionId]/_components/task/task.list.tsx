import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { Checkbox, Divider } from '@/ui';
import TaskCard from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/task/task.card';
import classNames from 'classnames';
import { useEffect, useState } from 'react';

type TasksListProps = {
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

const TasksList = ({
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

export default TasksList;
