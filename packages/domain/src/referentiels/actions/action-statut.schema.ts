import * as z from 'zod/mini';
import { statutAvancementEnumSchemaCreateInDatabase } from './action-statut-avancement.enum.schema';

export const actionStatutSchema = z.object({
  collectiviteId: z.number(),
  actionId: z.string(),
  avancement: statutAvancementEnumSchemaCreateInDatabase,
  avancementDetaille: z.nullable(z.tuple([z.number(), z.number(), z.number()])),
  concerne: z.boolean(),
  modifiedBy: z.nullable(z.uuid()),
  modifiedAt: z.iso.datetime(),
});

export type ActionStatut = z.infer<typeof actionStatutSchema>;

export const actionStatutSchemaCreate = z.object({
  collectiviteId: actionStatutSchema.shape.collectiviteId,
  actionId: actionStatutSchema.shape.actionId,
  concerne: actionStatutSchema.shape.concerne,
  avancementDetaille: z.optional(actionStatutSchema.shape.avancementDetaille),
  avancement: statutAvancementEnumSchemaCreateInDatabase,
});

export type ActionStatutCreate = z.infer<typeof actionStatutSchemaCreate>;
