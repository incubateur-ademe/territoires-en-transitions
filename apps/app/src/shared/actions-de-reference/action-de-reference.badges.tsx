import { appLabels } from '@/app/labels/catalog';
import { type ActionDeReference, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { Badge, cn, VisibleWhen } from '@tet/ui';
import type { JSX } from 'react';
import { ActionDeReferenceTypeBadge } from './action-de-reference-type.badge';

const ActionDeReferenceBadges = ({
  action,
  hasUpdateButton,
  showTypeBadge = false,
  showLevierAndCategorieBadges = true,
}: {
  readonly action: ActionDeReference;
  readonly hasUpdateButton: boolean;
  readonly showTypeBadge?: boolean;
  readonly showLevierAndCategorieBadges?: boolean;
}): JSX.Element => (
  <div className={cn('flex flex-wrap gap-2', hasUpdateButton && 'pr-8')}>
    {showTypeBadge && <ActionDeReferenceTypeBadge />}
    <VisibleWhen condition={showLevierAndCategorieBadges}>
      {action.leviers.map((levier) => (
        <Badge
          key={levier}
          title={LEVIER_NOM_BY_ID[levier]}
          size="sm"
          type="outlined"
          trim={false}
          uppercase={false}
        />
      ))}
      {action.categories.map((categorie) => (
        <Badge
          key={categorie}
          title={appLabels.categorieActionLabel(categorie)}
          size="sm"
          variant="info"
          trim={false}
          uppercase={false}
        />
      ))}
    </VisibleWhen>
  </div>
);

export { ActionDeReferenceBadges };
