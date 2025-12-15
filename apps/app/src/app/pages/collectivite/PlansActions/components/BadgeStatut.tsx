import { Statut } from '@tet/domain/plans';
import { Badge, BadgeState } from '@tet/ui';
import classNames from 'classnames';

export const statusToState: Record<Statut | 'Sans statut', BadgeState> = {
  'À venir': 'standard',
  'En cours': 'info',
  Réalisé: 'success',
  'En pause': 'new',
  Abandonné: 'grey',
  'A discuter': 'custom',
  Bloqué: 'warning',
  'En retard': 'error',
  'Sans statut': 'custom',
};

type Props = {
  className?: string;
  count?: number;
  statut: Statut | 'Sans statut';
  // Rend une version plus petite du composant
  size?: 'sm' | 'md';
};

/** Badge représentant le statut d'une fiche */
const BadgeStatut = ({ className, statut, size, count }: Props) => {
  return (
    <Badge
      dataTest="FicheActionBadgeStatut"
      className={classNames(className, {
        'bg-[#F9F3FE] border-[#F9F3FE] text-[#9351CF]': statut === 'A discuter',
        'bg-white border-grey-4 text-grey-6': statut === 'Sans statut',
      })}
      title={`${count ? count : ''} ${statut}`}
      state={statusToState[statut]}
      size={size}
    />
  );
};

export default BadgeStatut;
