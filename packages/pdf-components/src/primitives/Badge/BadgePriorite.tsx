import { prioritesToState } from '../../fiche-action/external-types';
import { Priorite } from '@tet/domain/plans';
import { BadgeSize } from '../../ui-compat';
import classNames from 'classnames';
import { Badge } from './Badge';

type BadgePrioriteProps = {
  priorite: Priorite;
  size?: BadgeSize;
  uppercase?: boolean;
  className?: string;
};

export const BadgePriorite = ({
  priorite,
  uppercase = true,
  className,
  ...props
}: BadgePrioriteProps) => {
  return (
    <Badge
      title={priorite}
      variant={prioritesToState[priorite]}
      uppercase={uppercase}
      className={classNames(className, 'border-grey-3 bg-grey-1')}
      {...props}
    />
  );
};
