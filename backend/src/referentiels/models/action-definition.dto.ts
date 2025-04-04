import { preuveSchemaEssential } from '@/backend/collectivites/documents/models/preuve.dto';
import z from 'zod';
import { actionDefinitionSchema } from './action-definition.table';
import { actionTypeIncludingExempleSchema } from './action-type.enum';

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
