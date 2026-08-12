import * as z from 'zod/mini';

export const ObjetPreuveEnum = {
  ACTE_ENGAGEMENT: 'acte_engagement',
  CANDIDATURE: 'candidature',
} as const;

export const objetPreuveEnumSchema = z.enum(ObjetPreuveEnum);

export type ObjetPreuve = (typeof ObjetPreuveEnum)[keyof typeof ObjetPreuveEnum];
