import { ActionId, ReferentielId } from '@tet/domain/referentiels';
import { useMemo } from 'react';
import { DiscussionListItem, useListDiscussions } from './use-list-discussions';

export const useListCommentsGroupedByActionId = (
  referentielId: ReferentielId,
  {
    enabled = true,
  }: {
    enabled?: boolean;
  } = {}
) => {
  const { data: comments } = useListDiscussions(
    referentielId,
    { status: 'ouvert' },
    { limit: 'all' },
    { enabled }
  );

  const commentsByActionId = useMemo(() => {
    return (comments?.discussions ?? []).reduce((acc, comment) => {
      (acc[comment.actionId] ??= []).push(comment);
      return acc;
    }, {} as Partial<Record<ActionId, DiscussionListItem[]>>);
  }, [comments]);

  return { commentsByActionId };
};
