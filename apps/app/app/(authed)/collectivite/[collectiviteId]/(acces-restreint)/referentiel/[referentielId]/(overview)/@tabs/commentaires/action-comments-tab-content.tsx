'use client';

import ActionCommentsTabHeader from '@/app/referentiels/actions/comments/action-comments-tab.header';
import ActionCommentFeed from '@/app/referentiels/actions/comments/action-comments.feed';
import { useListActionComments } from '@/app/referentiels/actions/comments/hooks/use-list-action-comments';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  DiscussionOrderBy,
  discussionOrderByEnum,
  DiscussionStatus,
} from '@tet/domain/collectivites';

export const ActionCommentsTabContent = () => {
  const referentielId = useReferentielId();
  const collectiviteId = useCollectiviteId();

  const {
    selectedAction,
    selectedStatus,
    setSelectedStatus,
    handleOrderByChange,
    commentsCount,
    handleActionChange,
    displayedDiscussions,
    isPending,
    canCreateDiscussion,
    selectedOrderBy,
  } = useListActionComments({
    referentielId,
    collectiviteId,
    selectedOrderBy: discussionOrderByEnum.CREATED_AT,
  });

  if (isPending) {
    return <SpinnerLoader className="m-auto" />;
  }

  return (
    <div
      data-test="ActionCommentsTabContent"
      className="flex flex-col justify-between"
    >
      <ActionCommentsTabHeader
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
        commentsCount={commentsCount}
      />

      {/** Feed */}
      <div className="mb-auto">
        <ActionCommentFeed
          state={selectedStatus}
          orderBy={selectedOrderBy}
          discussions={displayedDiscussions}
          isInputDisabled={!canCreateDiscussion}
          isDisplayedAsPanel={false}
        />
      </div>
    </div>
  );
};
