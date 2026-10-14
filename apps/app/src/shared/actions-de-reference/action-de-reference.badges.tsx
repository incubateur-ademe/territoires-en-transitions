import { appLabels } from '@/app/labels/catalog';
import { type ActionDeReference, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { Badge, cn } from '@tet/ui';
import type { JSX } from 'react';
import { ActionDeReferenceAdemeBadge } from './action-de-reference-ademe.badge';

const ActionDeReferenceBadges = ({
  action,
  hasUpdateButton,
  showAdemeBadge = false,
}: {
  readonly action: ActionDeReference;
  readonly hasUpdateButton: boolean;
  readonly showAdemeBadge?: boolean;
}): JSX.Element => (
  <div className={cn('flex flex-wrap gap-2', hasUpdateButton && 'pr-8')}>
    {showAdemeBadge && <ActionDeReferenceAdemeBadge />}
    <Badge
      title={LEVIER_NOM_BY_ID[action.levier]}
      size="sm"
      type="outlined"
      trim={false}
      uppercase={false}
    />
    <Badge
      title={appLabels.categorieActionLabel(action.categorie)}
      size="sm"
      variant="info"
      trim={false}
      uppercase={false}
    />
  </div>
);

export { ActionDeReferenceBadges };
