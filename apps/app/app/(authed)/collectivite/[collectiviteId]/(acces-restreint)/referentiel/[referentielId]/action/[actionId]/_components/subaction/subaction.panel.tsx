import { ActionPreuvePanel } from '@/app/referentiels/actions/action-preuve.panel.lazy';
import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { SubActionStatutDropdown } from '@/app/referentiels/actions/sub-action-statut.dropdown';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import {
  ActionDefinitionSummary,
  useActionSummaryChildren,
} from '@/app/referentiels/referentiel-hooks';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { Tab, Tabs, sideMenuContentZindex } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { ScoreIndicatifBadge } from '../score-indicatif/score-indicatif.badge';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';
import TasksList from '../task/task.cards-list';
import SubactionCardActions from './subaction-card.actions';

type Props = {
  subAction: ActionDefinitionSummary;
};

const SubActionPanel = ({ subAction }: Props) => {
  const { statut, filled } = useActionStatut(subAction.id);
  const { concerne, avancement } = statut ?? {};
  const tasks = useActionSummaryChildren(subAction);
  const preuvesCount = useActionPreuvesCount(subAction.id);

  const [shouldShowJustifications, setShouldShowJustifications] =
    useState(true);

  const [openDetailledModal, setOpenDetailledModal] = useState(false);

  const shouldHideTasksStatus =
    concerne === false ||
    (statut !== null &&
      avancement !== 'non_renseigne' &&
      avancement !== 'detaille') ||
    (statut !== null && avancement === 'detaille');

  const isDetailled =
    avancement === 'detaille' ||
    (avancement === 'non_renseigne' && filled === true) ||
    (statut === null && filled === true);

  return (
    <div>
      <div
        className={classNames(
          'bg-grey-2 border-b border-primary-3 w-full p-4 flex flex-col gap-2 sticky top-0',
          sideMenuContentZindex
        )}
      >
        {/* Titre et badges */}
        <p className="text-primary-9 text-2xl font-bold leading-7 mb-0">
          {subAction.identifiant} {subAction.nom}
        </p>
        <div className="flex flex-wrap gap-2">
          <SubActionStatutDropdown
            actionDefinition={subAction}
            openDetailledState={{
              isOpen: openDetailledModal,
              setIsOpen: setOpenDetailledModal,
            }}
          />
          {subAction.haveScoreIndicatif && (
            <ScoreIndicatifBadge actionId={subAction.id} />
          )}
          <ScoreRatioBadge actionId={subAction.id} size="sm" />
        </div>

        {/* Infos score indicatif */}
        <ScoreIndicatifLibelle actionId={subAction.id} />

        {/* Actions */}
        <SubactionCardActions
          actionId={subAction.id}
          haveScoreIndicatif={subAction.haveScoreIndicatif}
          isDetailled={isDetailled}
          setOpenDetailledModal={setOpenDetailledModal}
        />
      </div>

      <Tabs className="p-4" size="sm">
        {tasks.length > 0 ? (
          <Tab label={`Tâches (${tasks.length})`}>
            <TasksList
              subActionId={subAction.id}
              tasks={tasks}
              hideStatus={shouldHideTasksStatus}
              displayJustificationCheckbox={true}
              shouldShowJustifications={shouldShowJustifications}
              setShouldShowJustifications={setShouldShowJustifications}
            />
          </Tab>
        ) : undefined}

        <Tab label={`Documents (${preuvesCount})`}>
          <ActionPreuvePanel action={subAction} showWarning displayInPanel />
        </Tab>
      </Tabs>
    </div>
  );
};

export default SubActionPanel;
