import { Badge, BadgeState } from '@/ui';
import classNames from 'classnames';

import { TFicheActionNiveauxPriorite } from '@/app/types/alias';

type Extends<T, U extends T> = U;
export type PrioriteState = Extends<
  BadgeState,
  'success' | 'warning' | 'error'
>;
export const prioritesToState: Record<
  TFicheActionNiveauxPriorite,
  PrioriteState
> = {
  Bas: 'success',
  Moyen: 'warning',
  Élevé: 'error',
};

type Props = {
  className?: string;
  priorite: TFicheActionNiveauxPriorite;
  // Rend une version plus petite du composant
  size?: 'sm' | 'md';
};

const BadgePriorite = ({ className, priorite, size }: Props) => {
  return (
    <Badge
      className={classNames(className, '!border-grey-3 !bg-grey-1')}
      title={priorite}
      state={prioritesToState[priorite]}
      size={size}
      light
    />
  );
};

export default BadgePriorite;
