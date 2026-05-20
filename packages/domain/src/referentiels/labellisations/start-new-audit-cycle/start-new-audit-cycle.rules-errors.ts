import { createEnumObject } from '../../../utils';

export const startNewAuditCycleRulesErrors = [
  'AUDIT_REQUEST_PENDING',
  'AUDIT_IN_PROGRESS',
  'LABELLISATION_IN_PROGRESS',
] as const;

export type StartNewAuditCycleRulesErrors =
  (typeof startNewAuditCycleRulesErrors)[number];

export const StartNewAuditCycleRulesErrorsEnum = createEnumObject(
  startNewAuditCycleRulesErrors
);
