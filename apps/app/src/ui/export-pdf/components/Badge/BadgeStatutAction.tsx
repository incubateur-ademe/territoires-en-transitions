import { avancementToLabel } from '@/app/app/labels';
import { statusToState } from '@/app/referentiels/actions/action-statut/action-statut.badge';
import { StatutAvancementIncludingNonConcerne } from '@tet/domain/referentiels';
import classNames from 'classnames';
import { Badge } from './Badge';

type BadgeStatutActionProps = {
  statut: StatutAvancementIncludingNonConcerne;
  barre?: boolean;
  size?: 'sm' | 'md';
  uppercase?: boolean;
  className?: string;
};

export const BadgeStatutAction = ({
  statut,
  barre,
  uppercase = true,
  className,
  ...props
}: BadgeStatutActionProps) => {
  return (
    <Badge
      title={avancementToLabel[statut]}
      state={statusToState[statut].state}
      uppercase={uppercase}
      className={classNames(
        {
          'line-through': barre,
          'border-grey-4 bg-white': statut === 'non_renseigne',
        },
        className
      )}
      {...props}
    />
  );
};
