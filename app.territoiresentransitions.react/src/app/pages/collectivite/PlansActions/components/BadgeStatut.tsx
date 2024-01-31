import {Badge, BadgeState} from '@tet/ui';

import {TFicheActionStatuts} from 'types/alias';

const statusToState: Record<TFicheActionStatuts, BadgeState> = {
  'À venir': 'standard',
  'En cours': 'info',
  Réalisé: 'success',
  'En pause': 'warning',
  Abandonné: 'grey',
};

type Props = {
  className?: string;
  statut: TFicheActionStatuts;
  // Rend une version plus petite du composant
  size?: 'sm' | 'md';
};

/** Badge représentant le statut d'une fiche action */
const BadgeStatut = ({className, statut, size}: Props) => {
  return (
    <Badge
      dataTest="FicheActionBadgeStatut"
      className={className}
      title={statut}
      state={statusToState[statut]}
      size={size}
    />
  );
};

export default BadgeStatut;
