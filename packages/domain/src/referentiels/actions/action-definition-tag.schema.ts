import * as z from 'zod/mini';
import { referentielIdEnumSchema } from '../referentiel-id.enum';

export const actionDefinitionTagSchema = z.object({
  referentielId: referentielIdEnumSchema,
  actionId: z.string(),
  tagRef: z.string(),
});

export type ActionDefinitionTag = z.infer<typeof actionDefinitionTagSchema>;
