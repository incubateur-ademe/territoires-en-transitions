import { useActionId } from '@/app/referentiels/actions/action-context';
import SubActionDescription from '@/app/referentiels/actions/sub-action/sub-action.description';
import {
  ActionListItem,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import { useSubActionPreuvesCount } from '@/app/referentiels/preuves/use-action-preuves-count';
import { useStickyHeaderHeight } from '@/app/ui/layout/HeaderSticky';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { AccordionControlled, cn } from '@tet/ui';
import { ActionExplicationField } from '../action/action-explication.field';
import ScoreIndicatifLibelle from '../score-indicatif/score-indicatif.libelle';
import { SidePanelButton } from '../side-panel/buttons';
import TaskCardsList from '../task/task.cards-list';
import SubactionCardActions from './subaction-card.actions';
import { SubactionCardHeader } from './subaction-card.header';

const SubactionHeader = ({
  subAction,
  isExpanded,
  toggleExpand,
  commentsCount,
}: {
  subAction: ActionListItem;
  isExpanded: boolean;
  toggleExpand: () => void;
  commentsCount: number;
}) => {
  const pageRootActionId = useActionId();
  const preuvesCount = useSubActionPreuvesCount(
    pageRootActionId,
    subAction.actionId
  );

  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );

  const stickyHeaderHeight = useStickyHeaderHeight();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`Sous-action ${subAction.identifiant}`}
      onClick={toggleExpand}
      style={{ top: stickyHeaderHeight }}
      className={cn('p-4 rounded-t-lg cursor-pointer', {
        'bg-primary-1 hover:bg-primary-1': isExpanded,
        'bg-grey-1': !isExpanded,
      })}
    >
      <SubactionCardHeader
        subAction={subAction}
        isExpanded={isExpanded}
        toggleExpand={toggleExpand}
        actions={[
          <SidePanelButton
            key="documents"
            panelId="documents"
            count={preuvesCount}
            targetActionId={subAction.actionId}
          />,
          ...(canReadComments
            ? [
                <SidePanelButton
                  key="comments"
                  panelId="comments"
                  count={commentsCount}
                  targetActionId={subAction.actionId}
                />,
              ]
            : []),
        ]}
      />

      <ScoreIndicatifLibelle action={subAction} />

      <SubactionCardActions action={subAction} />
    </div>
  );
};

const SubactionContent = ({
  subAction,
  tasks,
}: {
  subAction: ActionListItem;
  tasks: ActionListItem[];
}) => (
  <div className={cn('flex flex-col gap-4 p-4')}>
    {(subAction.description || subAction.exemples !== '') && (
      <SubActionDescription subAction={subAction} className="text-sm" />
    )}

    <TaskCardsList className="mt-2" tasks={tasks} />
  </div>
);

type SubActionCardProps = {
  subAction: ActionListItem;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  showJustifications: boolean;
  commentsCount: number;
};

const SubActionCard = ({
  subAction,
  isExpanded,
  onToggleExpanded,
  showJustifications,
  commentsCount,
}: SubActionCardProps) => {
  const { data: tasks = [] } = useListActions({
    actionIds: subAction.childrenIds,
  });

  return (
    <div
      id={subAction.actionId}
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
              commentsCount={commentsCount}
            />
            <div
              className={cn('px-4 pb-4 bg-white cursor-pointer', {
                'bg-primary-1': isExpanded,
                'rounded-lg': !isExpanded,
              })}
              onClick={toggleExpand}
            >
              {showJustifications && (
                <ActionExplicationField action={subAction} />
              )}
            </div>
          </>
        )}
        content={<SubactionContent subAction={subAction} tasks={tasks} />}
      />
    </div>
  );
};

export default SubActionCard;
