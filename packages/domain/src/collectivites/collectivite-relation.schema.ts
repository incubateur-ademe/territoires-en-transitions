import * as z from 'zod/mini';

export const collectiviteRelationSchema = z.object({
  id: z.number(),
  parentId: z.number(),
});

export type CollectiviteRelation = z.infer<typeof collectiviteRelationSchema>;
