'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import {
  DiscussionOrderBy,
  discussionOrderByEnum,
  DiscussionStatus,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import ActionCommentsTabHeader from '../../../action/[actionId]/_components/comments/action-comments-tab.header';

import { useMemo } from 'react';
import ActionCommentFeed from '../../../action/[actionId]/_components/comments/action-comments.feed';
import { useCommentsContent } from '../../../action/[actionId]/_components/comments/hooks/use-comments-content';

type Props = {
  parentActionId?: string;
  actionId?: string;
  referentielId: ReferentielId;
  actionsAndSubActionsTitleList: {
    actionId: string;
    identifiant: string;
    nom: string;
  }[];
};

export const ActionCommentsTabContent = ({
  parentActionId,
  actionId,
  referentielId,
  actionsAndSubActionsTitleList,
}: Props) => {
  const {
    selectedAction,
    selectedStatus,
    setSelectedStatus,
    handleOrderByChange,
    commentsCount,
    handleActionChange,
    displayedDiscussions,
    isPending,
    options,
    canCreateDiscussion,
    selectedOrderBy,
  } = useCommentsContent({
    parentActionId,
    actionId,
    referentielId,
    actionsAndSubActionsTitleList,
    selectedOrderBy: discussionOrderByEnum.CREATED_AT,
  });

  const actionsWithAllOption = useMemo(() => {
    return [
      {
        label: 'Toutes les mesures',
        value: 'all',
      },
      ...options,
    ];
  }, [options]);

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
        actionsOptions={actionsWithAllOption}
        commentsCount={commentsCount}
        referentielId={referentielId}
      />

      {/** Feed */}
      <div className="mb-auto">
        <ActionCommentFeed
          state={selectedStatus}
          orderBy={selectedOrderBy}
          discussions={displayedDiscussions}
          isInputDisabled={!canCreateDiscussion}
          isDisplayedAsPanel={false}
          referentielId={referentielId}
        />
      </div>
    </div>
  );
};
