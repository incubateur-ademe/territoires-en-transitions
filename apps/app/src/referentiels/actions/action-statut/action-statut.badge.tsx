import { avancementToLabel } from '@/app/app/labels';
import { StatutAvancementIncludingNonConcerne } from '@tet/domain/referentiels';
import { Badge, BadgeSize, BadgeVariant } from '@tet/ui';
import classNames from 'classnames';

type Props = {
  className?: string;
  statut: StatutAvancementIncludingNonConcerne;
  barre?: boolean;
  size?: BadgeSize;
};

export const statusToState: Record<
  StatutAvancementIncludingNonConcerne,
  { state: BadgeVariant; light?: boolean }
> = {
  non_renseigne: { state: 'grey', light: true },
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
  return (
    statut && (
      <Badge
        dataTest="ActionStatutBadge"
        title={avancementToLabel[statut]}
        size={size}
        variant={statusToState[statut].state}
        type={statut === 'non_renseigne' ? 'outlined' : 'solid'}
        trim={false}
        className={classNames(
          'min-w-fit',
          { 'line-through': barre },
          className
        )}
      />
    )
  );
};

export default ActionStatutBadge;
