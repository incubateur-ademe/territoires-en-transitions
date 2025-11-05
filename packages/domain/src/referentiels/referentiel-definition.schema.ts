import * as z from 'zod/mini';
import { actionTypeSchema } from './actions/action-type.enum';
import { referentielIdEnumSchema } from './referentiel-id.enum';

export const referentielDefinitionSchema = z.object({
  id: referentielIdEnumSchema,
  nom: z.string(),
  version: z.string(),
  hierarchie: actionTypeSchema.array(),
  locked: z.nullable(z.boolean()),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
});

export type ReferentielDefinition = z.infer<typeof referentielDefinitionSchema>;
