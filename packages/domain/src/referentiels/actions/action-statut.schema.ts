import * as z from 'zod/mini';
import { statutAvancementEnumSchema } from './action-statut-avancement.enum.schema';

export const actionStatutSchema = z.object({
  collectiviteId: z.number(),
  actionId: z.string(),
  avancement: statutAvancementEnumSchema,
  avancementDetaille: z.nullable(z.array(z.number())),
  concerne: z.boolean(),
  modifiedBy: z.nullable(z.uuid()),
  modifiedAt: z.iso.datetime(),
});

export type ActionStatut = z.infer<typeof actionStatutSchema>;

export const actionStatutSchemaCreate = z.partial(actionStatutSchema, {
  avancementDetaille: true,
  modifiedBy: true,
  modifiedAt: true,
});

export type ActionStatutCreate = z.infer<typeof actionStatutSchemaCreate>;
