export type AuditBadgeStatus =
  | 'auditRequested'
  | 'auditAssigned'
  | 'auditInProgress'
  | 'auditCompleted'
  | 'auditCompletedLabellisationInProgress';

export type AuditViewerRole = 'auditee' | 'auditor' | 'other';
