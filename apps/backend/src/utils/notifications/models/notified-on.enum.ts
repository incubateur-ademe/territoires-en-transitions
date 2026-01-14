import { createEnumObject } from '@tet/domain/utils';

export const NotifiedOn = [
  'update_fiche_pilote',
  'plans.reports.generate_plan_report_completed',
  'plans.reports.generate_plan_report_failed',
] as const;

export const NotifiedOnEnum = createEnumObject(NotifiedOn);

export type NotifiedOnType = (typeof NotifiedOn)[number];
