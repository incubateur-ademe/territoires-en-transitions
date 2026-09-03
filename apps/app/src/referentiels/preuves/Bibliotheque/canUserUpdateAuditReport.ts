import { canUpdateAuditReport } from '@tet/domain/referentiels';
import {
  hasPermission,
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
    isAuditeur: isUserAuditeurForAudit(user, preuve.audit.id),
    canMutateLabellisationDocuments: hasPermission(
      user,
      'referentiels.labellisations.mutate_documents',
      { collectiviteId: preuve.collectiviteId }
    ),
    audit: {
      clos: preuve.audit.clos,
      valide: preuve.audit.valide,
      dateFin: preuve.audit.dateFin,
    },
    now: new Date(),
  });
};
