import { z } from 'zod';
import { createEnumObject } from '../enum.utils';

export const notifiedOnValues = [
  'update_fiche_pilote',
  'plans.reports.generate_plan_report_completed',
  'plans.reports.generate_plan_report_failed',
] as const;

export const NotifiedOnEnum = createEnumObject(notifiedOnValues);

export const notifiedOnSchema = z.enum(notifiedOnValues);

export type NotifiedOn = z.infer<typeof notifiedOnSchema>;
