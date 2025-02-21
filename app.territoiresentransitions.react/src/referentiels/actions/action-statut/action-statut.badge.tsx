import { avancementToLabel } from '@/app/app/labels';
import { StatutAvancementIncludingNonConcerne } from '@/domain/referentiels';
import { Badge, BadgeState } from '@/ui';
import classNames from 'classnames';

type Props = {
  className?: string;
  statut: StatutAvancementIncludingNonConcerne;
  // Indique si le statut est barré
  barre?: boolean;
  // Rend une version plus petite du composant
  size?: 'sm' | 'md';
};

export const statusToState: Record<
  StatutAvancementIncludingNonConcerne,
  BadgeState
> = {
  non_renseigne: 'grey',
  pas_fait: 'warning',
  programme: 'info',
  detaille: 'standard',
  fait: 'success',
  non_concerne: 'grey',
};

const ActionStatutBadge = ({
  className,
  statut,
  barre,
  size = 'sm',
}: Props) => {
  return (
    <Badge
      dataTest="ActionStatutBadge"
      title={avancementToLabel[statut]}
      size={size}
      state={statusToState[statut]}
      light={statut === 'non_renseigne'}
      trim={false}
      className={classNames('min-w-fit', { 'line-through': barre }, className)}
    />
  );
};

export default ActionStatutBadge;
