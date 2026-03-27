import { avancementToLabel } from '@/app/app/labels';
import { StatutAvancementCreate } from '@tet/domain/referentiels';
import { Badge, BadgeSize, BadgeType, BadgeVariant } from '@tet/ui';
import classNames from 'classnames';

type Props = {
  className?: string;
  statut?: StatutAvancementCreate;
  barre?: boolean;
  size?: BadgeSize;
};

export const statusToState: Record<
  StatutAvancementCreate,
  { state: BadgeVariant; type?: BadgeType }
> = {
  non_renseigne: { state: 'grey', type: 'outlined' },
  pas_fait: { state: 'warning' },
  programme: { state: 'info' },
  detaille: { state: 'standard' },
  fait: { state: 'success' },
  non_concerne: { state: 'grey' },
};

const ActionStatutBadge = ({
  className,
  statut,
  barre,
  size = 'xs',
}: Props) => {
  if (!statut) {
    return null;
  }

  return (
    <Badge
      dataTest="ActionStatutBadge"
      title={avancementToLabel[statut]}
      size={size}
      variant={statusToState[statut].state}
      type={statusToState[statut].type ?? 'solid'}
      trim={false}
      className={classNames('min-w-fit', { 'line-through': barre }, className)}
    />
  );
};

export default ActionStatutBadge;
