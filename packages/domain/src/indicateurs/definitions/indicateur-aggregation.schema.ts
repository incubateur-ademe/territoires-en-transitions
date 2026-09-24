import * as z from 'zod/mini';
import { createEnumObject } from '../../utils/enum.utils';

export const indicateurAggregationValues = [
  'somme',
  'moyenne',
  'derniere_valeur',
] as const;

export const IndicateurAggregationEnum = createEnumObject(
  indicateurAggregationValues
);
export const indicateurAggregationSchema = z.enum(indicateurAggregationValues);
export type IndicateurAggregation = z.infer<typeof indicateurAggregationSchema>;
