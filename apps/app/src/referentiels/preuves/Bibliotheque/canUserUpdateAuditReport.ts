import { canUpdateAuditReport } from '@tet/domain/referentiels';
import { isUserAuditeurForAudit, UserRolesAndPermissions } from '@tet/domain/users';
import { TPreuve } from './types';

export const canUserUpdateAuditReport = (
  user: UserRolesAndPermissions,
  preuve: TPreuve
): boolean => {
  if (preuve.preuve_type !== 'audit' || preuve.audit === null) {
    return false;
  }
  return canUpdateAuditReport({
    isAuditeur: isUserAuditeurForAudit(user, preuve.audit.id),
    audit: {
      clos: preuve.audit.clos,
      valide: preuve.audit.valide,
      dateFin: preuve.audit.date_fin,
    },
    now: new Date(),
  });
};
