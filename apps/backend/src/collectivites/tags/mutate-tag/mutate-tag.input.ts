import { TagEnum } from '@tet/domain/collectivites';
import { z } from 'zod';

export const tagTypeSchema = z.enum([
  TagEnum.Financeur,
  TagEnum.Personne,
  TagEnum.Partenaire,
  TagEnum.Service,
  TagEnum.Structure,
  TagEnum.Libre,
  TagEnum.InstanceGouvernance,
]);

const idSchema = z.number().int().positive();
const tagNameSchema = z.string().trim().min(1);

export const createTagInputSchema = z.object({
  tagType: tagTypeSchema,
  nom: tagNameSchema,
  collectiviteId: idSchema,
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

export const updateTagInputSchema = z.object({
  tagType: tagTypeSchema,
  id: idSchema,
  nom: tagNameSchema,
  collectiviteId: idSchema,
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

export const deleteTagInputSchema = z.object({
  tagType: tagTypeSchema,
  id: idSchema,
  collectiviteId: idSchema,
});

export type DeleteTagInput = z.infer<typeof deleteTagInputSchema>;
