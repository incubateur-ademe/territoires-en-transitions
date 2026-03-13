import { useGetActionFromSnapshot } from './use-get-action-from-snapshot';

export function useGetActionScore({
  actionId,
  externalCollectiviteId,
}: {
  actionId: string;
  externalCollectiviteId?: number;
}) {
  const { data: action } = useGetActionFromSnapshot({
    actionId,
    externalCollectiviteId,
  });

  if (!action) {
    return;
  }

  return action.score;
}

