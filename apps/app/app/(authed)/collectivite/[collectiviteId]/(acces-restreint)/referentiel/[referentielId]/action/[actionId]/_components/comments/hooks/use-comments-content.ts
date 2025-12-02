import {
  canCreateDiscussion,
  isSousMesure,
  sortDiscussions,
} from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  DiscussionOrderBy,
  DiscussionStatus,
  discussionStatus,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { useEffect, useMemo, useState } from 'react';
import { useListDiscussions } from './use-list-discussions';

type UseCommentsContentProps = {
  parentActionId?: string;
  actionId?: string;
  referentielId: ReferentielId;
  actionsAndSubActionsTitleList: {
    actionId: string;
    identifiant: string;
    nom: string;
  }[];
  updateTitlePanel?: (title: string) => void;
  selectedOrderBy: DiscussionOrderBy;
};

export const useCommentsContent = ({
  parentActionId,
  actionId,
  referentielId,
  actionsAndSubActionsTitleList,
  updateTitlePanel,
  selectedOrderBy,
}: UseCommentsContentProps) => {
  const [selectedAction, setSelectedAction] = useState<string | undefined>(
    actionId !== undefined ? actionId : 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<DiscussionStatus>(
    discussionStatus.OUVERT
  );
  const [commentsCount, setCommentsCount] = useState<number>(0);

  const [selectedOrderByState, setSelectedOrderBy] =
    useState<DiscussionOrderBy>(selectedOrderBy);

  const { data: discussions, isPending } = useListDiscussions(referentielId, {
    actionId:
      actionId && isSousMesure(actionId, referentielId)
        ? parentActionId
        : actionId,
  });

  const currentCollectivite = useCurrentCollectivite();

  const options = useMemo(() => {
    const options = actionsAndSubActionsTitleList.map((action) => ({
      label: `${action.identifiant} ${action.nom}`,
      value: action.actionId,
    }));

    return options;
  }, [actionsAndSubActionsTitleList]);

  const handleActionChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSelectedAction(value);
    }
  };

  const filteredDiscussions = useMemo(() => {
    return (
      discussions?.discussions.filter(
        (discussion) =>
          (selectedAction === 'all' ||
            (selectedAction !== undefined &&
              discussion.actionId.startsWith(selectedAction))) &&
          (selectedStatus === 'all'
            ? true
            : discussion.status === selectedStatus)
      ) ?? []
    );
  }, [discussions, selectedAction, selectedStatus]);

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
    updateTitlePanel?.(`${count} Commentaires`);
  }, [displayedDiscussions, updateTitlePanel]);

  // Set selected action based on actionId
  useEffect(() => {
    if (actionId === undefined) {
      setSelectedAction('all');
    } else {
      setSelectedAction(actionId);
    }
  }, [actionId]);

  return {
    selectedAction,
    selectedStatus,
    setSelectedStatus,
    selectedOrderBy: selectedOrderByState,
    handleOrderByChange,
    commentsCount,
    options,
    handleActionChange,
    displayedDiscussions,
    isPending,
    canCreateDiscussion: canCreateDiscussion(currentCollectivite),
    currentCollectivite,
    setSelectedOrderBy,
  };
};
