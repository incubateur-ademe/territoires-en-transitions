import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import { ActionPreuvePanel } from '@/app/referentiels/actions/action-preuve.panel.lazy';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { SubActionStatutDropdown } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import SubActionDescription from '@/app/referentiels/actions/sub-action/sub-action.description';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useActionSummaryChildren } from '@/app/referentiels/referentiel-hooks';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { Tab, Tabs, sideMenuContentZindex } from '@/ui';
import TasksList from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/task/task.list';
import classNames from 'classnames';
import { useState } from 'react';
import { ScoreIndicatifBadge } from '../score-indicatif/score-indicatif.badge';

type Props = {
  actionName: string;
  subAction: ActionDefinitionSummary;
};

const SubActionContent = ({ actionName, subAction }: Props) => {
  const { statut, filled } = useActionStatut(subAction.id);
  const { concerne, avancement } = statut ?? {};
  const tasks = useActionSummaryChildren(subAction);
  const preuvesCount = useActionPreuvesCount(subAction.id);

  const [shouldShowJustifications, setShouldShowJustifications] =
    useState(true);

  const shouldHideTasksStatus =
    concerne === false ||
    (statut !== null &&
      avancement !== 'non_renseigne' &&
      avancement !== 'detaille') ||
    (statut !== null && avancement === 'detaille');

  const shouldDisplayScore =
    concerne !== false &&
    (avancement === 'detaille' ||
      (avancement === 'non_renseigne' && filled === true) ||
      (statut === null && filled === true));

  return (
    <div>
      <div
        className={classNames(
          'bg-grey-2 border-b border-primary-3 w-full p-4 flex flex-col gap-2 sticky top-0',
          sideMenuContentZindex
        )}
      >
        <p className="text-grey-8 text-sm font-medium mb-0">{actionName}</p>
        <p className="text-primary-9 text-xl font-bold mb-0">
          {subAction.identifiant} {subAction.nom}
        </p>
        <div className="flex flex-wrap gap-2">
          <SubActionStatutDropdown actionDefinition={subAction} />
          {subAction.haveScoreIndicatif && (
            <ScoreIndicatifBadge actionId={subAction.id} />
          )}
          {shouldDisplayScore && (
            <ScoreRatioBadge actionId={subAction.id} size="sm" />
          )}
        </div>
      </div>

      <Tabs className="p-4" size="sm">
        {tasks.length > 0 ? (
          <Tab label={`Tâches (${tasks.length})`}>
            <TasksList
              tasks={tasks}
              hideStatus={shouldHideTasksStatus}
              displayJustificationCheckbox={true}
              shouldShowJustifications={shouldShowJustifications}
              setShouldShowJustifications={setShouldShowJustifications}
            />
          </Tab>
        ) : undefined}

        <Tab label={`Documents (${preuvesCount})`}>
          <ActionPreuvePanel action={subAction} showWarning />
        </Tab>

        {subAction.referentiel === 'eci' &&
        (subAction.description || subAction.haveExemples) ? (
          <Tab label="Description">
            <SubActionDescription subAction={subAction} />
          </Tab>
        ) : undefined}
      </Tabs>
    </div>
  );
};

export default SubActionContent;
