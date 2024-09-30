import { Statut } from '@tet/api/plan-actions/fiche-resumes.list';
import { Badge, BadgeState } from '@tet/ui';
import classNames from 'classnames';

const statusToState: Record<Statut, BadgeState> = {
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
  statut: Statut;
  // Rend une version plus petite du composant
  size?: 'sm' | 'md';
};

/** Badge représentant le statut d'une fiche action */
const BadgeStatut = ({ className, statut, size }: Props) => {
  return (
    <Badge
      dataTest="FicheActionBadgeStatut"
      className={classNames(className, {
        'bg-[#F9F3FE] border-[#F9F3FE] text-[#9351CF]': statut === 'A discuter',
      })}
      title={statut}
      state={statusToState[statut]}
      size={size}
    />
  );
};

export default BadgeStatut;
