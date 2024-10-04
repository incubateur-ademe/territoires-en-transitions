import { Statut as PlanActionStatut } from '@tet/api/plan-actions/domain';
import { Badge, BadgeState } from '@tet/ui';
import classNames from 'classnames';

const statusToState: Record<PlanActionStatut, BadgeState> = {
  'À venir': 'standard',
  'En cours': 'info',
  Réalisé: 'success',
  'En pause': 'new',
  Abandonné: 'grey',
  'A discuter': 'custom',
  Bloqué: 'warning',
  'En retard': 'error',
};

type Props = {
  className?: string;
  count?: number;
  statut: PlanActionStatut;
  // Rend une version plus petite du composant
  size?: 'sm' | 'md';
};

/** Badge représentant le statut d'une fiche action */
const BadgeStatut = ({ className, statut, size, count }: Props) => {
  return (
    <Badge
      dataTest="FicheActionBadgeStatut"
      className={classNames(className, {
        'bg-[#F9F3FE] border-[#F9F3FE] text-[#9351CF]': statut === 'A discuter',
      })}
      title={`${count ? count : ''} ${statut}`}
      state={statusToState[statut]}
      size={size}
    />
  );
};

export default BadgeStatut;
