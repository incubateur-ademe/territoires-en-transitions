import { TagEnum, TagType } from '@tet/domain/collectivites';
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

export const listTagsInputSchema = z.object({
  tagType: tagTypeSchema,
  collectiviteId: z.number().positive().optional(),
  collectiviteIds: z.array(z.number().positive()).optional(),
});

export type ListTagsInput = z.infer<typeof listTagsInputSchema>;
