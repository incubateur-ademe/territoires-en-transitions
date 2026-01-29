import * as z from 'zod/mini';
import { actionIdSchema } from '../actions/action-definition.schema';
import { referentielIdEnumSchema } from '../referentiel-id.enum';

export const etoileActionConditionDefinitionSchema = z.object({
  etoile: z.number(),
  priorite: z.number(),
  referentielId: referentielIdEnumSchema,
  actionId: actionIdSchema,
  formulation: z.string(),
  minRealisePercentage: z.number(),
  minProgrammePercentage: z.nullable(z.number()),
  minRealiseScore: z.nullable(z.number()),
  minProgrammeScore: z.nullable(z.number()),
});

export type EtoileActionConditionDefinition = z.infer<
  typeof etoileActionConditionDefinitionSchema
>;
