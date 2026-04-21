import { useActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import SubActionDescription from '@/app/referentiels/actions/sub-action/sub-action.description';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import {
  ActionDefinitionSummary,
  useActionSummaryChildren,
} from '@/app/referentiels/referentiel-hooks';
import { useStickyHeaderHeight } from '@/app/ui/layout/HeaderSticky';
import { useIsVisitor } from '@/app/users/authorizations/use-is-visitor';
import { AccordionControlled, Button, cn } from '@tet/ui';
import { ActionJustificationField } from '../action/action.justification-field';
import { pluralize } from '../pluralize';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';
import { useActionSidePanel } from '../side-panel/context';
import TaskCardsList from '../task/task.cards-list';
import SubactionCardActions from './subaction-card.actions';
import { SubactionCardHeader } from './subaction-card.header';

const OpenPanelButton = ({
  label,
  onClick,
  isActive,
}: {
  label: string;
  onClick: () => void;
  isActive?: boolean;
}) => (
  <Button
    variant="unstyled"
    size="xs"
    icon="layout-right-line"
    iconPosition="right"
    className={cn(
      'px-2 py-1 font-medium rounded-md border-[1px] text-xs flex gap-1 items-center justify-center text-nowrap',
      isActive
        ? 'bg-primary-9 border-primary-9 text-white'
        : 'text-grey-8 border-grey-4'
    )}
    onClick={onClick}
  >
    {label}
  </Button>
);

const SubactionHeader = ({
  subAction,
  isExpanded,
  toggleExpand,
}: {
  subAction: ActionDefinitionSummary;
  isExpanded: boolean;
  toggleExpand: () => void;
}) => {
  const preuvesCount = useActionPreuvesCount(subAction.id);
  const isVisitor = useIsVisitor();
  const { togglePanel, isActive } = useActionSidePanel();
  const stickyHeaderHeight = useStickyHeaderHeight();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`Sous-action ${subAction.identifiant}`}
      onClick={toggleExpand}
      style={{ top: stickyHeaderHeight }}
      className={cn('sticky z-10 p-4 rounded-t-lg cursor-pointer', {
        'bg-primary-1 hover:bg-primary-1': isExpanded,
        'bg-grey-1': !isExpanded,
      })}
    >
      <SubactionCardHeader
        subAction={subAction}
        isExpanded={isExpanded}
        toggleExpand={toggleExpand}
        actions={[
          <OpenPanelButton
            key="documents"
            label={pluralize(preuvesCount, 'document')}
            onClick={() => togglePanel('documents', subAction.id)}
            isActive={isActive('documents', subAction.id)}
          />,
          ...(!isVisitor
            ? [
                <OpenPanelButton
                  key="comments"
                  label={pluralize(
                    subAction.openDiscussionsCount ?? 0,
                    'commentaire'
                  )}
                  onClick={() => togglePanel('comments', subAction.id)}
                  isActive={isActive('comments', subAction.id)}
                />,
              ]
            : []),
        ]}
      />

      <ScoreIndicatifLibelle actionId={subAction.id} />

      <SubactionCardActions action={subAction} />
    </div>
  );
};

const SubactionContent = ({
  subAction,
  tasks,
  hideTasksStatus,
}: {
  subAction: ActionDefinitionSummary;
  tasks: ActionDefinitionSummary[];
  hideTasksStatus: boolean;
}) => (
  <div className={cn('flex flex-col gap-4 p-4')}>
    {(subAction.description || subAction.haveExemples) && (
      <SubActionDescription subAction={subAction} className="text-sm" />
    )}

    <TaskCardsList
      className="mt-2"
      tasks={tasks}
      hideStatus={hideTasksStatus}
    />
  </div>
);

type SubActionCardProps = {
  subAction: ActionDefinitionSummary;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  showJustifications: boolean;
};

const SubActionCard = ({
  subAction,
  isExpanded,
  onToggleExpanded,
  showJustifications,
}: SubActionCardProps) => {
  const { statut } = useActionStatut(subAction.id);
  const { avancement } = statut || {};

  const tasks = useActionSummaryChildren(subAction);

  const shouldHideTasksStatus =
    statut?.concerne === false ||
    (statut !== null &&
      avancement !== 'non_renseigne' &&
      avancement !== 'detaille') ||
    (statut !== null && avancement === 'detaille');

  return (
    <div
      id={subAction.id}
      data-test={`SousAction-${subAction.identifiant}`}
      className={cn(
        'border border-grey-3 rounded-lg bg-grey-1 transition-colors',
        { 'hover:bg-grey-2': !isExpanded }
      )}
    >
      <AccordionControlled
        expanded={isExpanded}
        setExpanded={onToggleExpanded}
        renderHeader={({ isExpanded: expanded, toggleExpand }) => (
          <>
            <SubactionHeader
              subAction={subAction}
              isExpanded={expanded}
              toggleExpand={toggleExpand}
            />
            <div
              className={cn('px-4 pb-4 bg-white cursor-pointer', {
                'bg-primary-1': isExpanded,
                'rounded-lg': !isExpanded,
              })}
              onClick={toggleExpand}
            >
              {showJustifications && (
                <ActionJustificationField
                  actionId={subAction.id}
                  placeholder="Explications sur l'etat d'avancement"
                />
              )}
            </div>
          </>
        )}
        content={
          <SubactionContent
            subAction={subAction}
            tasks={tasks}
            hideTasksStatus={shouldHideTasksStatus}
          />
        }
      />
    </div>
  );
};

export default SubActionCard;
