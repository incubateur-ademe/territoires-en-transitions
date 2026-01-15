import { TagCreate, TagEnum, TagType, TagUpdate } from '@tet/domain/collectivites';
import { z } from 'zod';

export const tagTypeSchema = z.enum([
  TagEnum.Financeur,
  TagEnum.Personne,
  TagEnum.Partenaire,
  TagEnum.Service,
  TagEnum.Structure,
  TagEnum.Categorie,
  TagEnum.Libre,
]);

export const createTagInputSchema = z.object({
  tagType: tagTypeSchema,
  nom: z.string().min(1),
  collectiviteId: z.number().positive(),
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const updateTagInputSchema = z.object({
  tagType: tagTypeSchema,
  id: z.number().positive(),
  nom: z.string().min(1).optional(),
  collectiviteId: z.number().positive(),
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

export const deleteTagInputSchema = z.object({
  tagType: tagTypeSchema,
  id: z.number().positive(),
  collectiviteId: z.number().positive(),
});

export type DeleteTagInput = z.infer<typeof deleteTagInputSchema>;
