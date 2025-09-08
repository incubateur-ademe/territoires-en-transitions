import { preuveSchemaEssential } from '@/backend/collectivites/documents/models/preuve.dto';
import { personneTagOrUserSchema } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { tagWithCollectiviteIdSchema } from '@/backend/collectivites/tags/tag.table-base';
import { scoreFinalSchema } from '@/backend/referentiels/compute-score/score.dto';
import z from 'zod';
import { actionDefinitionSchema } from './action-definition.table';
import { statutAvancementIncludingNonConcerneEnumSchema } from './action-statut.table';
import {
  actionTypeIncludingExempleSchema,
  actionTypeSchema,
} from './action-type.enum';

// type Increment<N extends number> = N extends infer R
//   ? [...Array<R>, unknown]['length']
//   : never;

// export type TreeNode2<T, Depth extends number = 0> = Depth extends 5
//   ? never
//   : T & {
//       actionsEnfant: TreeNode2<T, Increment<Depth>>[];
//     };

type RecursiveTreeNode<T> = T & {
  actionsEnfant: RecursiveTreeNode<T>[];
};

export type TreeNode<T> = T extends infer R ? RecursiveTreeNode<R> : never;

// T extends infer R ? YourLogic<R> : never;
// type Simplify<T> = { [K in keyof T]: T[K] } & {};

// export function treeNodeSchema<T extends SomeZodObject>(
//   schema: T
// ): z.ZodType<TreeNode<z.infer<T>>> {
//   return schema.extend({
//     actionsEnfant: z.lazy(() =>
//       z.array(treeNodeSchema(schema) as z.ZodType<TreeNode<z.infer<T>>>)
//     ),
//   }) as z.ZodType<TreeNode<z.infer<T>>>;
// }

export const actionDefinitionEssentialSchema = actionDefinitionSchema
  .pick({
    actionId: true,
    points: true,
  })
  .extend({
    // categorie: actionDefinitionSchema.shape.categorie.optional(),
    // pourcentage: actionDefinitionSchema.shape.pourcentage.optional(),

    level: z.number(),
    actionType: actionTypeIncludingExempleSchema,
    // action catalogues include cae, eci but also biodiversite, eau
    tags: z.string().array().optional(),
    preuves: preuveSchemaEssential.array().optional(),
  });

export type ActionDefinitionEssential = z.infer<
  typeof actionDefinitionEssentialSchema
>;

export const actionSchema = actionDefinitionSchema.extend({
  pilotes: personneTagOrUserSchema.array(),
  services: tagWithCollectiviteIdSchema.array(),
  statut: statutAvancementIncludingNonConcerneEnumSchema.optional(),
  desactive: z.boolean().optional(),
  concerne: z.boolean().optional(),
  depth: z.number().optional(),
  actionType: actionTypeSchema.optional(),
});

export type Action = z.infer<typeof actionSchema>;

const actionWithScoreSchema = actionSchema.extend({
  score: scoreFinalSchema.optional(),
});

export type ActionWithScore = z.infer<typeof actionWithScoreSchema>;
