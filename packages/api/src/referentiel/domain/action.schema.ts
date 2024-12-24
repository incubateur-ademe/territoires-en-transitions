import { referentielTypeEnumSchema } from '@/domain/referentiels';
import { z } from 'zod';

/**
 * Schéma zod d'une action du référentiel
 */
export const actionSchema = z.object({
  id: z.string(),
  parent: z.string().nullish(),
  referentiel: referentielTypeEnumSchema,
});
