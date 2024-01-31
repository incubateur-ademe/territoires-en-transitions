import {Badge, BadgeState} from '@tet/ui';

import {TFicheActionNiveauxPriorite} from 'types/alias';

const prioritesToState: Record<TFicheActionNiveauxPriorite, BadgeState> = {
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

const BadgePriorite = ({className, priorite, size}: Props) => {
  return (
    <Badge
      className={className}
      title={priorite}
      state={prioritesToState[priorite]}
      size={size}
      light
    />
  );
};

export default BadgePriorite;
