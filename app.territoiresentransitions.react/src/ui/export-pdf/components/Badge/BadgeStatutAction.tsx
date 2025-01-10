import { avancementToLabel } from '@/app/app/labels';
import { statusToState } from '@/app/referentiels/actions/action-statut.badge';
import { TActionAvancementExt } from '@/app/types/alias';
import classNames from 'classnames';
import { Badge } from './Badge';

type BadgeStatutActionProps = {
  statut: TActionAvancementExt;
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
      state={statusToState[statut]}
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
