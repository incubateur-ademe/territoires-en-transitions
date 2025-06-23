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
  { state: BadgeState; light?: boolean }
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
  size = 'sm',
}: Props) => {
  return (
    statut && (
      <Badge
        dataTest="ActionStatutBadge"
        title={avancementToLabel[statut]}
        size={size}
        state={statusToState[statut].state}
        light={statut === 'non_renseigne'}
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
