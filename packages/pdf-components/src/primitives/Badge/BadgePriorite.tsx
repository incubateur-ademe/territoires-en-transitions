import { SizeVariant } from '@tet/design-tokens';
import { Priorite } from '@tet/domain/plans';
import classNames from 'classnames';
import { prioritesToState } from '../../fiche-action/external-types';
import { Badge } from './Badge';

type BadgePrioriteProps = {
  priorite: Priorite;
  size?: SizeVariant;
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
