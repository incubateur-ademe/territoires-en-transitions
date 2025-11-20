import { MesureAuditStatutEnum } from '@tet/domain/referentiels';
import { Badge, BadgeState } from '@tet/ui';

export const statusToLabel: Record<MesureAuditStatutEnum, string> = {
  non_audite: 'Non audité',
  en_cours: 'Audit en cours',
  audite: 'Audité',
};

export const statusToState: Record<
  MesureAuditStatutEnum,
  { state: BadgeState }
> = {
  non_audite: { state: 'warning' },
  en_cours: { state: 'info' },
  audite: { state: 'success' },
};

/**
 * Affiche un badge représentant un statut d'audit
 */
export const BadgeAuditStatut = ({
  statut,
}: {
  statut: MesureAuditStatutEnum;
}) => {
  return (
    <Badge
      title={statusToLabel[statut]}
      state={statusToState[statut].state}
      size="sm"
    />
  );
};
