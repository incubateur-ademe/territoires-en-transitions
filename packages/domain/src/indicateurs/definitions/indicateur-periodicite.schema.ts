import * as z from 'zod/mini';
import { createEnumObject } from '../../utils/enum.utils';

export const indicateurPeriodiciteValues = ['annuelle', 'mensuelle'] as const;

export const IndicateurPeriodiciteEnum = createEnumObject(
  indicateurPeriodiciteValues
);

export const indicateurPeriodiciteSchema = z.enum(indicateurPeriodiciteValues);

export type IndicateurPeriodicite = z.infer<typeof indicateurPeriodiciteSchema>;
