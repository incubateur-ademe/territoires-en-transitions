import { createEnumObject } from '../../../utils';

export const requestLabellisationRulesErrors = [
  'ETOILE_NOT_ALLOWED_FOR_AUDIT_ONLY',
  'MISSING_ETOILE_FOR_LABELLISATION',
  'AUDIT_COT_NOT_ALLOWED_FOR_COLLECTIVITE_NOT_COT',
  'REFERENTIEL_NOT_COMPLETED',
  'AUDIT_ALREADY_REQUESTED',
  'SCORE_GLOBAL_CRITERIA_NOT_SATISFIED',
  'SCORE_ACTIONS_CRITERIA_NOT_SATISFIED',
  'MISSING_FILE',
] as const;

export type RequestLabellisationRulesErrors =
  (typeof requestLabellisationRulesErrors)[number];

export const RequestLabellisationRulesErrorsEnum = createEnumObject(
  requestLabellisationRulesErrors
);
