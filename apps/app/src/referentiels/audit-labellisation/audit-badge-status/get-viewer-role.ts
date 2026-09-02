import { AuditViewerRole } from './types';

type Input = {
  isAuditor: boolean;
  canMutate: boolean;
};

export function getViewerRole({ isAuditor, canMutate }: Input): AuditViewerRole {
  if (isAuditor) return 'auditor';
  if (canMutate) return 'auditee';
  return 'other';
}
