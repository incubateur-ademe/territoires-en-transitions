import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import {
  DiscussionOrderBy,
  discussionOrderByEnum,
  DiscussionStatus,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import ActionCommentsPanelHeader from './action-comments-panel.header';
import ActionCommentFeed from './action-comments.feed';
import { useCommentsContent } from './hooks/use-comments-content';

type Props = {
  parentActionId?: string;
  actionId?: string;
  referentielId: ReferentielId;
  actionsAndSubActionsTitleList: {
    actionId: string;
    identifiant: string;
    nom: string;
  }[];
  updateTitlePanel?: (title: string) => void;
};

const ActionCommentsSidePanelContent = ({
  parentActionId,
  actionId,
  referentielId,
  actionsAndSubActionsTitleList,
  updateTitlePanel,
}: Props) => {
  const {
    selectedAction,
    selectedStatus,
    setSelectedStatus,
    selectedOrderBy,
    handleOrderByChange,
    handleActionChange,
    displayedDiscussions,
    options,
    isPending,
    canCreateDiscussion,
  } = useCommentsContent({
    parentActionId,
    actionId,
    referentielId,
    actionsAndSubActionsTitleList,
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
        actionsOptions={options}
        canCreateDiscussion={canCreateDiscussion}
        parentActionId={parentActionId}
        referentielId={referentielId}
      />
      {/** Feed */}
      <div className="mb-auto">
        <ActionCommentFeed
          state={selectedStatus}
          orderBy={selectedOrderBy}
          discussions={displayedDiscussions}
          isInputDisabled={!canCreateDiscussion}
          isDisplayedAsPanel={true}
          referentielId={referentielId}
        />
      </div>
    </div>
  );
};

export default ActionCommentsSidePanelContent;
