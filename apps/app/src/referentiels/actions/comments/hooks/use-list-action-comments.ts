import { sortDiscussions } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useListActionsGroupedById } from '@/app/referentiels/actions/use-list-actions-grouped-by-id';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  DiscussionOrderBy,
  DiscussionStatus,
  discussionStatus,
} from '@tet/domain/collectivites';
import { ActionTypeEnum, ReferentielId } from '@tet/domain/referentiels';
import { useEffect, useMemo, useState } from 'react';
import { pluralize } from '../../pluralize';
import { useListDiscussions } from './use-list-discussions';

type UseCommentsContentProps = {
  action?: ActionListItem;
  updateTitlePanel?: (title: string) => void;
  selectedOrderBy: DiscussionOrderBy;
  referentielId: ReferentielId;
  collectiviteId: number;
};

export const useListActionComments = ({
  action,
  updateTitlePanel,
  selectedOrderBy,
  referentielId,
  collectiviteId,
}: UseCommentsContentProps) => {
  const [{ data: actions }] = useListActionsGroupedById({
    referentielIds: [referentielId],
    collectiviteId,
  });

  const [selectedActionId, setSelectedActionId] = useState<string | undefined>(
    action !== undefined ? action.actionId : 'all'
  );

  const selectedAction = useMemo(() => {
    return actions && selectedActionId && selectedActionId !== 'all'
      ? actions[selectedActionId]
      : undefined;
  }, [actions, selectedActionId]);

  const [selectedStatus, setSelectedStatus] = useState<DiscussionStatus>(
    discussionStatus.OUVERT
  );
  const [commentsCount, setCommentsCount] = useState<number>(0);

  const [selectedOrderByState, setSelectedOrderBy] =
    useState<DiscussionOrderBy>(selectedOrderBy);

  const { data: discussions, isPending } = useListDiscussions(referentielId, {
    actionId:
      selectedActionId === 'all'
        ? undefined
        : selectedActionId !== undefined &&
          action &&
          action.actionType === ActionTypeEnum.SOUS_ACTION
        ? action.parentId ?? undefined
        : selectedActionId,
  });

  const { hasCollectivitePermission } = useCurrentCollectivite();

  const handleActionChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSelectedActionId(value);
    }
  };

  const filteredDiscussions = useMemo(() => {
    return (
      discussions?.discussions.filter(
        (discussion) =>
          (selectedActionId === 'all' ||
            (selectedActionId !== undefined &&
              discussion.actionId.startsWith(selectedActionId))) &&
          (selectedStatus === 'all'
            ? true
            : discussion.status === selectedStatus)
      ) ?? []
    );
  }, [discussions, selectedActionId, selectedStatus]);

  const displayedDiscussions = useMemo(() => {
    return sortDiscussions(selectedOrderByState, filteredDiscussions);
  }, [filteredDiscussions, selectedOrderByState]);

  const handleOrderByChange = (value: DiscussionOrderBy) => {
    setSelectedOrderBy(value);
  };

  // Update comments count and panel title
  useEffect(() => {
    const count = displayedDiscussions.reduce(
      (acc, discussion) => acc + discussion.messages.length,
      0
    );
    setCommentsCount(count);
    updateTitlePanel?.(pluralize(count, 'commentaire'));
  }, [displayedDiscussions, updateTitlePanel]);

  // Set selected action based on actionId
  useEffect(() => {
    if (action === undefined) {
      setSelectedActionId('all');
    } else {
      setSelectedActionId(action.actionId);
    }
  }, [action]);

  return {
    discussions,
    selectedActionId,
    selectedAction,
    selectedStatus,
    setSelectedStatus,
    selectedOrderBy: selectedOrderByState,
    handleOrderByChange,
    commentsCount,
    handleActionChange,
    displayedDiscussions,
    isPending,
    canCreateDiscussion: hasCollectivitePermission(
      'referentiels.discussions.mutate'
    ),
    setSelectedOrderBy,
  };
};
