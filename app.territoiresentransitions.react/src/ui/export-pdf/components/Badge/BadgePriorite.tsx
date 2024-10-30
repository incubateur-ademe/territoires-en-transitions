import classNames from 'classnames';
import { prioritesToState } from '@tet/app/pages/collectivite/PlansActions/components/BadgePriorite';
import { TFicheActionNiveauxPriorite } from 'types/alias';
import { Badge } from './Badge';

type BadgePrioriteProps = {
  priorite: TFicheActionNiveauxPriorite;
  size?: 'sm' | 'md';
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
      state={prioritesToState[priorite]}
      uppercase={uppercase}
      className={classNames(className, 'border-grey-3 bg-grey-1')}
      {...props}
    />
  );
};
