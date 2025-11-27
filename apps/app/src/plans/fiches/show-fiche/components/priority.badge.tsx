import { Badge, BadgeState } from '@/ui';

import { Priorite } from '@/domain/plans';

export const prioritiesToBadgeState: Record<
  Priorite | 'Sans priorité',
  BadgeState
> = {
  Bas: 'success',
  Moyen: 'warning',
  Élevé: 'error',
  'Sans priorité': 'grey',
};

const DEFAULT_LABEL = 'Sans priorité';

export const PriorityBadge = ({ priority }: { priority: Priorite | null }) => {
  const title = priority ?? DEFAULT_LABEL;
  const state = prioritiesToBadgeState[title];
  return <Badge title={title} state={state} />;
};
