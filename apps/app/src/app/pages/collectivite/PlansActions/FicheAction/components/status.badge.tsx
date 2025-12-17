import { Statut as StatutType } from '@tet/domain/plans';
import { Badge, BadgeState } from '@tet/ui';
import classNames from 'classnames';

export const statusToState: Record<StatutType | 'Sans statut', BadgeState> = {
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

const DEFAULT_LABEL = 'Sans statut';

export const StatusBadge = ({ status }: { status: StatutType | null }) => {
  const title = status ?? DEFAULT_LABEL;
  const state = statusToState[title];
  return (
    <Badge
      dataTest="FicheActionBadgeStatut"
      className={classNames({
        'bg-[#F9F3FE] border-[#F9F3FE] text-[#9351CF]': status === 'A discuter',
      })}
      title={title}
      state={state}
    />
  );
};
