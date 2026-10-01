import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const listActionDefinitionsInputSchema = z.object({
  referentielId: referentielIdEnumSchema,
});

export type ListActionDefinitionsInput = z.infer<
  typeof listActionDefinitionsInputSchema
>;
