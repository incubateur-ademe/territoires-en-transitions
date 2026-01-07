import { createEnumObject } from '@tet/domain/utils';

export const NotifiedOn = [
  'update_fiche_pilote',
  'generate_plan_report_completed',
  'generate_plan_report_failed',
] as const;

export const NotifiedOnEnum = createEnumObject(NotifiedOn);

export type NotifiedOnType = (typeof NotifiedOn)[number];
