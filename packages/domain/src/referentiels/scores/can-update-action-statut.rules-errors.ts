import { createEnumObject } from '../../utils';

export const canUpdateActionStatutRulesErrors = [
  'ACTION_DISABLED',
  'AUDIT_STARTED_BUT_NOT_AUDITEUR',
  'AUDIT_VALIDATED',
] as const;

export type CanUpdateActionStatutRulesErrors =
  (typeof canUpdateActionStatutRulesErrors)[number];

export const CanUpdateActionStatutRulesErrorsEnum = createEnumObject(
  canUpdateActionStatutRulesErrors
);
