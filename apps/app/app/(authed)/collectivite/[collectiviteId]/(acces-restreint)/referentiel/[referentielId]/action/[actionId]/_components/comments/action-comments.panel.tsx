import { useUser } from '@/api/users/user-context/user-provider';
import {
  canCreateDiscussion,
  isAdeme,
  isSousMesure,
  sortDiscussions,
} from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import {
  DiscussionMessages,
  discussionOrderByValues,
  DiscussionStatus,
  discussionStatus,
} from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { useEffect, useState } from 'react';
import ActionCommentsPageHeader from './action-comments-page.header';
import ActionCommentsPanelHeader from './action-comments-panel.header';
import ActionCommentFeed from './action-comments.feed';
import { useListDiscussions } from './hooks/use-list-discussions';

type Props = {
  isDisplayedAsPanel?: boolean;
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

const ActionCommentsPanel = ({
  isDisplayedAsPanel = false,
  parentActionId,
  actionId,
  referentielId,
  actionsAndSubActionsTitleList,
  updateTitlePanel,
}: Props) => {
  const [selectedAction, setSelectedAction] = useState<string | undefined>(
    'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<DiscussionStatus>(
    discussionStatus.OUVERT
  );
  const [selectedOrderBy, setSelectedOrderBy] = useState<string>(
    isDisplayedAsPanel
      ? discussionOrderByValues.ACTION_ID
      : discussionOrderByValues.CREATED_AT
  );
  const [commentsCount, setCommentsCount] = useState<number>(0);

  const [displayedDiscussions, setDisplayedDiscussions] = useState<
    DiscussionMessages[]
  >([]);

  const { data: discussions, isPending } = useListDiscussions(referentielId, {
    actionId:
      actionId && isSousMesure(actionId, referentielId)
        ? parentActionId
        : actionId,
  });

  const user = useUser();
  const isSupport = user?.isSupport;

  const actionsOptions = actionsAndSubActionsTitleList.map((action) => ({
    label: `${action.identifiant} ${action.nom}`,
    value: action.actionId,
  }));

  actionsOptions.unshift({
    label: isDisplayedAsPanel
      ? 'Mesures et toutes les sous-mesures'
      : 'Toutes les mesures',
    value: 'all',
  });

  const onDiscussionCountUpdate = (
    discussionMessages: DiscussionMessages[]
  ) => {
    const count = discussionMessages?.reduce(
      (acc, discussion) => acc + discussion.messages.length,
      0
    );
    updateTitlePanel?.(`${count} Commentaires`);
    setCommentsCount(count);
  };

  const handleOrderByChange = (value: string) => {
    setSelectedOrderBy(value);
    const orderedDiscussions = sortDiscussions(value, displayedDiscussions);
    setDisplayedDiscussions(orderedDiscussions);
  };

  useEffect(() => {
    const filteredDiscussions =
      discussions?.discussions.filter(
        (discussion) =>
          (selectedAction === 'all' ||
            discussion.actionId === selectedAction) &&
          (selectedStatus === 'all'
            ? true
            : discussion.status === selectedStatus)
      ) ?? [];
    const orderedDiscussions = sortDiscussions(
      selectedOrderBy,
      filteredDiscussions
    );
    setDisplayedDiscussions(orderedDiscussions);
    onDiscussionCountUpdate(orderedDiscussions);
  }, [discussions, selectedAction, selectedStatus]);

  useEffect(() => {
    if (actionId && isSousMesure(actionId, referentielId)) {
      setSelectedAction(actionId);
    } else {
      setSelectedAction('all');
    }
  }, [actionId]);

  if (isPending) {
    return <SpinnerLoader className="m-auto" />;
  }

  return (
    <div
      data-test="ActionDiscussionsPanel"
      className=" flex flex-col justify-between"
    >
      {isDisplayedAsPanel ? (
        <ActionCommentsPanelHeader
          selectedOrderBy={selectedOrderBy}
          onOrderByChange={(value: string) => handleOrderByChange(value)}
          selectedStatus={selectedStatus}
          onStatusChange={(value: DiscussionStatus) => setSelectedStatus(value)}
          selectedAction={selectedAction}
          onActionChange={(value: string | undefined) =>
            setSelectedAction(value)
          }
          actionsOptions={actionsOptions}
          canCreateDiscussion={canCreateDiscussion(user)}
          parentActionId={parentActionId}
          referentielId={referentielId}
        />
      ) : (
        <ActionCommentsPageHeader
          selectedOrderBy={selectedOrderBy}
          onOrderByChange={(value: string) => handleOrderByChange(value)}
          selectedStatus={selectedStatus}
          onStatusChange={(value: DiscussionStatus) => setSelectedStatus(value)}
          selectedAction={selectedAction}
          onActionChange={(value: string | undefined) =>
            setSelectedAction(value)
          }
          actionsOptions={actionsOptions}
          commentsCount={commentsCount}
          referentielId={referentielId}
        />
      )}

      {/** Feed */}
      <div className="mb-auto">
        <ActionCommentFeed
          state={selectedStatus}
          orderBy={selectedOrderBy}
          discussions={displayedDiscussions}
          isInputDisabled={isSupport || isAdeme(user)}
          isDisplayedAsPanel={isDisplayedAsPanel}
          referentielId={referentielId}
        />
      </div>
    </div>
  );
};

export default ActionCommentsPanel;
