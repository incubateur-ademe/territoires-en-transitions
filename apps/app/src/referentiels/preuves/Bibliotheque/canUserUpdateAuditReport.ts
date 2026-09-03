import { canUpdateAuditReport } from '@tet/domain/referentiels';
import {
  isUserAuditeurForAudit,
  UserRolesAndPermissions,
} from '@tet/domain/users';
import { Preuve } from './types';

export const canUserUpdateAuditReport = (
  user: UserRolesAndPermissions,
  preuve: Preuve
): boolean => {
  if (preuve.preuveType !== 'audit') {
    return false;
  }
  return canUpdateAuditReport({
    editor: isUserAuditeurForAudit(user, preuve.audit.id) ? 'auditeur' : 'tiers',
    audit: {
      clos: preuve.audit.clos,
      valide: preuve.audit.valide,
      dateFin: preuve.audit.dateFin,
    },
    now: new Date(),
  });
};
