import { Badge, BadgeState } from '@/ui';
import { TAuditStatut } from './types';

export const statusToLabel: Record<TAuditStatut, string> = {
  non_audite: 'Non audité',
  en_cours: 'Audit en cours',
  audite: 'Audité',
};

export const statusToState: Record<TAuditStatut, { state: BadgeState }> = {
  non_audite: { state: 'warning' },
  en_cours: { state: 'info' },
  audite: { state: 'success' },
};

/**
 * Affiche un badge représentant un statut d'audit
 */
export const BadgeAuditStatut = ({ statut }: { statut: TAuditStatut }) => {
  return (
    <Badge
      title={statusToLabel[statut]}
      state={statusToState[statut].state}
      size="sm"
    />
  );
};
