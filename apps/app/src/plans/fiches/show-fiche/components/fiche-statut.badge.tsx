import { ColorVariant, SizeVariant } from '@tet/design-tokens';
import { Statut } from '@tet/domain/plans';
import { Badge } from '@tet/ui';
import classNames from 'classnames';

export const statusToVariant: Record<Statut | 'Sans statut', ColorVariant> = {
  'À venir': 'standard',
  'En cours': 'info',
  Réalisé: 'success',
  'En pause': 'new',
  Abandonné: 'grey',
  'A discuter': 'custom',
  Bloqué: 'warning',
  'En retard': 'error',
  'Sans statut': 'grey',
};

type Props = {
  count?: number;
  statut: Statut | null;
  size?: SizeVariant;
};

/** Badge représentant le statut d'une fiche */
const FicheStatutBadge = ({ statut: defaultStatut, size, count }: Props) => {
  const statut = defaultStatut ?? 'Sans statut';

  return (
    <Badge
      dataTest="FicheActionBadgeStatut"
      className={classNames({
        'bg-[#F9F3FE] border-[#9351CF] text-[#9351CF]': statut === 'A discuter',
      })}
      title={`${count ? count : ''} ${statut}`}
      variant={statusToVariant[statut]}
      size={size}
    />
  );
};

export default FicheStatutBadge;
