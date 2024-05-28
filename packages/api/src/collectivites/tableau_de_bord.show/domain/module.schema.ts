import {z} from 'zod';
import {fetchOptionsSchema} from '../../../fiche_actions/shared/domain/fetch_options.schema';

export const moduleCommonSchemaInsert = z.object({
  id: z.string().uuid(),
  collectiviteId: z.number(),
  userId: z.string().uuid().nullish(),
  titre: z.string(),
  slug: z.string(),
});

export const moduleCommonSchemaSelect = moduleCommonSchemaInsert
  .required()
  .extend({
    createdAt: z.string().datetime(),
    modifiedAt: z.string().datetime(),
  });

export const moduleIndicateursSchema = z.object({
  type: z.literal('indicateur.list'),
  options: z.object({}),
});

export const moduleFicheActionsSchema = z.object({
  type: z.literal('fiche_action.list'),
  options: fetchOptionsSchema,
});

export const moduleSchemaSelect = z.discriminatedUnion('type', [
  moduleIndicateursSchema.merge(moduleCommonSchemaSelect),
  moduleFicheActionsSchema.merge(moduleCommonSchemaSelect),
]);

export type Module = z.infer<typeof moduleSchemaSelect>;
