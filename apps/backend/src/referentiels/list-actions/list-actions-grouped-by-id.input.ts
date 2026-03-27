import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const listActionsGroupedByIdInputSchema = z.object({
  collectiviteId: z.number(),
  referentielId: referentielIdEnumSchema,
});

export type ListActionsGroupedByIdInput = z.infer<
  typeof listActionsGroupedByIdInputSchema
>;
