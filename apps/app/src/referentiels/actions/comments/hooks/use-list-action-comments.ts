import { appLabels } from '@/app/labels/catalog';
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
  const { data } = useListActionsGroupedById({
    referentielIds: [referentielId],
    collectiviteId,
  });
  const actions = data.get(referentielId);

  const [selectedActionId, setSelectedActionId] = useState<string | undefined>(
    action !== undefined ? action.actionId : 'all'
  );

  // Aligne l'action sélectionnée sur celle reçue en prop. L'ajuster pendant le
  // rendu, plutôt que dans un effet, évite de demander au serveur les
  // discussions de l'action précédente le temps d'un rendu.
  const [previousAction, setPreviousAction] = useState(action);
  if (previousAction !== action) {
    setPreviousAction(action);
    setSelectedActionId(action === undefined ? 'all' : action.actionId);
  }

  const selectedAction = useMemo(() => {
    return actions && selectedActionId && selectedActionId !== 'all'
      ? actions.actionsById[selectedActionId]
      : undefined;
  }, [actions, selectedActionId]);

  const [selectedStatus, setSelectedStatus] = useState<DiscussionStatus>(
    discussionStatus.OUVERT
  );

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

  const { hasReferentielPermission } = useCurrentCollectivite();

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

  // Le total se calcule pendant le rendu : le tenir dans un état alimenté par
  // un effet le laissait en retard d'un rendu sur les discussions affichées.
  const commentsCount = displayedDiscussions.reduce(
    (acc, discussion) => acc + discussion.messages.length,
    0
  );

  // Le titre du panneau appartient à un autre composant : le mettre à jour
  // reste un effet de bord, et reste donc dans un effet.
  useEffect(() => {
    updateTitlePanel?.(appLabels.commentaires({ count: commentsCount }));
  }, [commentsCount, updateTitlePanel]);

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
    canCreateDiscussion: hasReferentielPermission(
      'referentiels.discussions.mutate',
      referentielId
    ),
    setSelectedOrderBy,
  };
};
