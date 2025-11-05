import * as z from 'zod/mini';

export const tagSchema = z.object({
  id: z.number(),
  nom: z.string(),
});

export type Tag = z.infer<typeof tagSchema>;

export const tagWithCollectiviteIdSchema = z.object({
  ...tagSchema.shape,
  collectiviteId: z.number(),
});

export type TagWithCollectiviteId = z.infer<typeof tagWithCollectiviteIdSchema>;

export const tagUpdateSchema = z.partial(tagWithCollectiviteIdSchema);

export type TagUpdate = z.input<typeof tagUpdateSchema>;

export const tagInsertSchema = z.partial(tagWithCollectiviteIdSchema, {
  id: true,
});

export type TagCreate = z.infer<typeof tagInsertSchema>;

export const TagEnum = {
  Financeur: 'financeur',
  Personne: 'personne',
  Partenaire: 'partenaire',
  Service: 'service',
  Structure: 'structure',
  Categorie: 'categorie',
  Libre: 'libre',
} as const;

export type TagType = (typeof TagEnum)[keyof typeof TagEnum];
