import * as z from 'zod/mini';
import { referentielIdEnumSchema } from '../referentiel-id.enum';
import { actionDefinitionSchema } from './action-definition.schema';

export const actionRelationSchema = z.object({
  id: z.string(),
  referentiel: referentielIdEnumSchema,
  parent: z.nullable(actionDefinitionSchema.shape.actionId),
});

export type ActionRelation = z.infer<typeof actionRelationSchema>;

export const actionRelationSchemaCreate = z.partial(actionRelationSchema, {
  parent: true,
});

export type ActionRelationCreate = z.infer<typeof actionRelationSchemaCreate>;
