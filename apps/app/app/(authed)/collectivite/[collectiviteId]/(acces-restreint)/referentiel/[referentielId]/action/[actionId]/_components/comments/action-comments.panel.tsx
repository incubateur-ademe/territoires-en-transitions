import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { DiscussionMessages } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { useEffect, useState } from 'react';
import ActionCommentsHeader, {
  TActionDiscussionStatus,
} from './action-comments-header';
import ActionCommentFeed from './action-comments.feed';
import {
  isSousMesure,
  orderDiscussions,
} from './helpers/action-comments-helper';
import { useListDiscussions } from './hooks/use-list-discussions';
import { useUserRoles } from './hooks/use-user-roles';

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
  updateDiscussionCount?: (count: number) => void;
};

const ActionCommentsPanel = ({
  isDisplayedAsPanel = false,
  parentActionId,
  actionId,
  referentielId,
  actionsAndSubActionsTitleList,
  updateDiscussionCount,
}: Props) => {
  const [selectedAction, setSelectedAction] = useState<string | undefined>(
    'all'
  );
  const [selectedStatus, setSelectedStatus] =
    useState<TActionDiscussionStatus>('ouvert');
  const [selectedOrderBy, setSelectedOrderBy] = useState<string>(
    isDisplayedAsPanel ? 'actionId' : 'createdAt'
  );
  const [commentsCount, setCommentsCount] = useState<number>(0);

  const [displayedDiscussions, setDisplayedDiscussions] = useState<
    DiscussionMessages[]
  >([]);

  const { data: discussions, isPending } = useListDiscussions(referentielId, {
    actionId: parentActionId,
  });

  const { canCreateDiscussion, isAdeme, isSupport } = useUserRoles();

  const actionsOptions = actionsAndSubActionsTitleList.map((action) => ({
    label: `${action.identifiant} ${action.nom}`,
    value: action.actionId,
  }));

  actionsOptions.unshift({
    label: 'Mesures et toutes les sous-mesures',
    value: 'all',
  });

  const updateTitlePanel = (discussionMessages: DiscussionMessages[]) => {
    const count = discussionMessages?.reduce(
      (acc, discussion) => acc + discussion.messages.length,
      0
    );
    updateDiscussionCount?.(count);
    setCommentsCount(count);
  };

  const handleOrderByChange = (value: string) => {
    setSelectedOrderBy(value);
    const orderedDiscussions = orderDiscussions(value, displayedDiscussions);
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
    const orderedDiscussions = orderDiscussions(
      selectedOrderBy,
      filteredDiscussions
    );
    setDisplayedDiscussions(orderedDiscussions);
    updateTitlePanel(orderedDiscussions);
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
      <ActionCommentsHeader
        selectedOrderBy={selectedOrderBy}
        onOrderByChange={(value: string) => handleOrderByChange(value)}
        selectedStatus={selectedStatus}
        onStatusChange={(value: TActionDiscussionStatus) =>
          setSelectedStatus(value)
        }
        selectedAction={selectedAction}
        onActionChange={(value: string | undefined) => setSelectedAction(value)}
        actionsOptions={actionsOptions}
        canCreateDiscussion={canCreateDiscussion}
        parentActionId={parentActionId ?? undefined}
        isdisplayedAsSidePanel={isDisplayedAsPanel}
        commentsCount={commentsCount}
        referentielId={referentielId}
      />

      {/** Feed */}
      <div className="mb-auto">
        <ActionCommentFeed
          state={selectedStatus}
          orderBy={selectedOrderBy}
          discussions={displayedDiscussions}
          isInputDisabled={isSupport || isAdeme}
          isDisplayedAsPanel={isDisplayedAsPanel}
          referentielId={referentielId}
        />
      </div>
    </div>
  );
};

export default ActionCommentsPanel;
