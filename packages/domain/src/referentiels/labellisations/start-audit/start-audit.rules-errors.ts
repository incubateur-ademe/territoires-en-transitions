import { createEnumObject } from '../../../utils';

export const startAuditRulesErrors = [
  'AUDIT_NOT_FOUND',
  'AUDIT_NOT_REQUESTED',
  'USER_NOT_AUDITOR',
] as const;

export type StartAuditRulesErrors = (typeof startAuditRulesErrors)[number];

export const StartAuditRulesErrorsEnum = createEnumObject(
  startAuditRulesErrors
);
