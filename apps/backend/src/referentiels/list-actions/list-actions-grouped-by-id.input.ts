import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const listActionsGroupedByIdInputSchema = z.object({
  collectiviteId: z.number(),
  referentielId: referentielIdEnumSchema,
  /** Référentiel TE uniquement : inclut les mesures désactivées par la personnalisation */
  includeDesactive: z.boolean().optional().default(false),
});

export type ListActionsGroupedByIdInput = z.infer<
  typeof listActionsGroupedByIdInputSchema
>;
