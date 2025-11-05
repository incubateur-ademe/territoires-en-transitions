import * as z from 'zod/mini';

export const categorieTagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.nullable(z.number()),
  groupementId: z.nullable(z.number()),
  visible: z.boolean(),
  createdAt: z.iso.datetime(),
  createdBy: z.nullable(z.uuid()),
});

export type CategorieTag = z.infer<typeof categorieTagSchema>;

export const categorieTagSchemaCreate = z.partial(categorieTagSchema, {
  id: true,
  collectiviteId: true,
  groupementId: true,
  visible: true,
  createdAt: true,
  createdBy: true,
});

export type CategorieTagCreate = z.infer<typeof categorieTagSchemaCreate>;
