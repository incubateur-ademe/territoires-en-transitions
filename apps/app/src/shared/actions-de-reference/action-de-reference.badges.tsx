import { appLabels } from '@/app/labels/catalog';
import { type ActionDeReference, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { Badge, cn } from '@tet/ui';
import type { JSX } from 'react';

const ActionDeReferenceBadges = ({
  action,
  hasUpdateButton,
}: {
  readonly action: ActionDeReference;
  readonly hasUpdateButton: boolean;
}): JSX.Element => (
  <div className={cn('flex flex-wrap gap-2', hasUpdateButton && 'pr-8')}>
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
