import { z } from 'zod';
import { referentielSchema } from './enum.schema';

/**
 * Schéma zod d'une action du référentiel
 */
export const actionSchema = z.object({
  id: z.string(),
  parent: z.string().nullish(),
  referentiel: referentielSchema,
});

/**
 * Type TS d'une action du référentiel
 */
export type Action = z.input<typeof actionSchema>;
