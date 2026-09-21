import * as z from 'zod/mini';
import { createEnumObject } from '../../utils/enum.utils';

export const indicateurPeriodiciteModeValues = [
  'recommandee',
  'imposee',
] as const;

export const IndicateurPeriodiciteModeEnum = createEnumObject(
  indicateurPeriodiciteModeValues
);

export const indicateurPeriodiciteModeSchema = z.enum(
  indicateurPeriodiciteModeValues
);
export type IndicateurPeriodiciteMode = z.infer<
  typeof indicateurPeriodiciteModeSchema
>;
