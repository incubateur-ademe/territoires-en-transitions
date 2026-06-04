import { appLabels } from '@/app/labels/catalog';
import { BadgeProps } from '@tet/ui';
import {
  AuditBadgeStatus,
  parcoursToAuditBadgeStatus,
} from '../audit-badge-status';
import { useChecklist } from '../checklist.context';

const badgeByStatus: Record<AuditBadgeStatus, Omit<BadgeProps, 'size'>> = {
  auditRequested: { title: appLabels.auditDemande, variant: 'info' },
  auditAssigned: { title: appLabels.auditAttribue, variant: 'warning' },
  auditInProgress: { title: appLabels.auditEnCours, variant: 'info' },
  auditCompleted: { title: appLabels.auditTermine, variant: 'success' },
  auditCompletedLabellisationInProgress: {
    title: appLabels.auditTermineLabellisationEnCours,
    variant: 'success',
  },
};

export function useAuditStatusBadge(): Omit<BadgeProps, 'size'> | null {
  const { cycle } = useChecklist();

  const status = parcoursToAuditBadgeStatus({
    parcours: cycle.parcours,
    isAuditor: cycle.isAuditeur,
  });

  if (!status) return null;
  return badgeByStatus[status];
}
