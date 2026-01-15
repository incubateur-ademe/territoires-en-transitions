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

export const TagEnum = {
  Financeur: 'financeur',
  Personne: 'personne',
  Partenaire: 'partenaire',
  Service: 'service',
  Structure: 'structure',
  Libre: 'libre',
} as const;

export type TagType = (typeof TagEnum)[keyof typeof TagEnum];
