import { lienSchema, preuveTypeEnumSchema } from '@tet/domain/collectivites';
import z from 'zod';

export const updatePreuveInputSchema = z
  .object({
    preuveId: z.number().int().positive(),
    preuveType: preuveTypeEnumSchema,
    lien: z.object(lienSchema.shape).optional(),
    commentaire: z.string().optional(),
  })
  .refine((d) => d.lien !== undefined || d.commentaire !== undefined, {
    message: 'au moins un des champs lien ou commentaire doit être fourni',
  });

export type UpdatePreuveInput = z.infer<typeof updatePreuveInputSchema>;

export const removePreuveInputSchema = z.object({
  preuveId: z.number().int().positive(),
  preuveType: preuveTypeEnumSchema,
});

export type RemovePreuveInput = z.infer<typeof removePreuveInputSchema>;
