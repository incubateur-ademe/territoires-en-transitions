import * as z from 'zod/mini';
import {
  StatutAvancementEnum,
  statutAvancementEnumCreateSchema,
  statutAvancementEnumSchemaCreateInDatabase,
} from './action-statut-avancement.enum.schema';

export const statutDetailleAuPourcentageSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
]);

export type StatutDetailleAuPourcentage = z.infer<
  typeof statutDetailleAuPourcentageSchema
>;

export const actionStatutSchema = z.object({
  collectiviteId: z.number(),
  actionId: z.string(),
  avancement: statutAvancementEnumSchemaCreateInDatabase,
  avancementDetaille: z.nullable(statutDetailleAuPourcentageSchema),
  concerne: z.boolean(),
  modifiedBy: z.nullable(z.uuid()),
  modifiedAt: z.iso.datetime(),
});

export type ActionStatut = z.infer<typeof actionStatutSchema>;

const baseActionStatutSchema = z.object({
  collectiviteId: actionStatutSchema.shape.collectiviteId,
  actionId: actionStatutSchema.shape.actionId,
});

export const actionStatutSchemaCreate = z.discriminatedUnion('statut', [
  z.object({
    ...baseActionStatutSchema.shape,
    statut: statutAvancementEnumCreateSchema.extract([
      StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
    ]),
    statutDetailleAuPourcentage: statutDetailleAuPourcentageSchema,
  }),
  z.object({
    ...baseActionStatutSchema.shape,
    statut: statutAvancementEnumCreateSchema.exclude([
      StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
    ]),
    statutDetailleAuPourcentage: z.optional(z.null()),
  }),
]);

export type ActionStatutCreate = z.infer<typeof actionStatutSchemaCreate>;
