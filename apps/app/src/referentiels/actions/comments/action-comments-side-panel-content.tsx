import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  DiscussionOrderBy,
  discussionOrderByEnum,
  DiscussionStatus,
} from '@tet/domain/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import ActionCommentsPanelHeader from './action-comments-panel.header';
import ActionCommentFeed from './action-comments.feed';
import { useListActionComments } from './hooks/use-list-action-comments';

type Props = {
  action: ActionListItem;
  updateTitlePanel?: (title: string) => void;
};

const ActionCommentsSidePanelContent = ({
  action,
  updateTitlePanel,
}: Props) => {
  const referentielId = getReferentielIdFromActionId(action.actionId);
  const collectiviteId = useCollectiviteId();

  const {
    selectedAction,
    selectedStatus,
    setSelectedStatus,
    selectedOrderBy,
    handleOrderByChange,
    handleActionChange,
    displayedDiscussions,
    isPending,
    canCreateDiscussion,
  } = useListActionComments({
    referentielId,
    collectiviteId,
    action,
    updateTitlePanel,
    selectedOrderBy: discussionOrderByEnum.ACTION_ID,
  });

  if (isPending) {
    return <SpinnerLoader className="m-auto" />;
  }

  return (
    <div
      data-test="ActionCommentsSidePanelContent"
      className=" flex flex-col justify-between"
    >
      <ActionCommentsPanelHeader
        selectedOrderBy={selectedOrderBy}
        onOrderByChange={(value: DiscussionOrderBy) =>
          handleOrderByChange(value)
        }
        selectedStatus={selectedStatus}
        onStatusChange={(value: DiscussionStatus) => setSelectedStatus(value)}
        selectedAction={selectedAction}
        onActionChange={(value: string | undefined) =>
          handleActionChange(value)
        }
        canCreateDiscussion={canCreateDiscussion}
        parentActionId={action.parentId ?? undefined}
        referentielId={referentielId}
        collectiviteId={collectiviteId}
      />
      {/** Feed */}
      <div className="mb-auto">
        <ActionCommentFeed
          state={selectedStatus}
          orderBy={selectedOrderBy}
          discussions={displayedDiscussions}
          isInputDisabled={!canCreateDiscussion}
          isDisplayedAsPanel={true}
        />
      </div>
    </div>
  );
};

export default ActionCommentsSidePanelContent;
