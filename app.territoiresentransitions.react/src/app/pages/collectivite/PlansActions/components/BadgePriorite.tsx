import { Badge, BadgeState } from '@tet/ui';
import classNames from 'classnames';

import { TFicheActionNiveauxPriorite } from 'types/alias';

export const prioritesToState: Record<TFicheActionNiveauxPriorite, BadgeState> =
  {
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
