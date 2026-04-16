import { appLabels } from '@/app/labels/catalog';
import { MesureAuditStatutEnum } from '@tet/domain/referentiels';
import { Badge, BadgeVariant } from '@tet/ui';

export const statusToLabel: Record<MesureAuditStatutEnum, string> = {
  non_audite: appLabels.auditNonAudite,
  en_cours: appLabels.auditEnCours,
  audite: appLabels.auditAudite,
};

export const statusToState: Record<
  MesureAuditStatutEnum,
  { state: BadgeVariant }
> = {
  non_audite: { state: 'warning' },
  en_cours: { state: 'info' },
  audite: { state: 'success' },
};

export const BadgeAuditStatut = ({
  statut,
}: {
  statut: MesureAuditStatutEnum;
}) => {
  return (
    <Badge
      title={statusToLabel[statut]}
      variant={statusToState[statut].state}
      size="xs"
    />
  );
};
