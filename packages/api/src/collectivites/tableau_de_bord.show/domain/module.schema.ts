import {z} from 'zod';
import {fetchOptionsSchema} from '../../../fiche_actions/shared/domain/fetch_options.schema';

const moduleCommonSchema = z.object({
  id: z.string().uuid(),
  collectiviteId: z.number(),
  userId: z.number(),
  titre: z.string(),
  description: z.string().nullish(),
  type: z.enum(['fiche_action.list', 'indicateur.list']),
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime(),
});

export const moduleIndicateursSchema = moduleCommonSchema.extend({
  type: z.literal('indicateur.list'),
  options: z.object({}),
});

export const moduleFicheActionsSchema = moduleCommonSchema.extend({
  type: z.literal('fiche_action.list'),
  options: fetchOptionsSchema,
});

export const moduleSchema = z.union([
  moduleIndicateursSchema,
  moduleFicheActionsSchema,
]);

export type Module = z.infer<typeof moduleSchema>;
