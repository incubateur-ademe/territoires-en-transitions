import {
  lienSchema,
  preuveTypeEnumSchema,
  preuveTypeEnumValues,
} from '@tet/domain/collectivites';
import { objetPreuveEnumSchema } from '@tet/domain/referentiels';
import z from 'zod';

const commonFields = {
  preuveId: z.number().int().positive(),
  lien: z.object(lienSchema.shape).optional(),
  commentaire: z.string().optional(),
};

export const updatePreuveInputSchema = z
  .discriminatedUnion('preuveType', [
    z.object({
      ...commonFields,
      preuveType: z.literal('labellisation'),
      objet: z.optional(z.nullable(objetPreuveEnumSchema)),
    }),
    z.object({
      ...commonFields,
      preuveType: z.enum(preuveTypeEnumValues).exclude(['labellisation']),
      objet: z.optional(z.undefined()),
    }),
  ])
  .refine(
    (input) =>
      input.lien !== undefined ||
      input.commentaire !== undefined ||
      input.objet !== undefined,
    {
      message:
        'au moins un des champs lien, commentaire ou objet doit être fourni',
    }
  );

export type UpdatePreuveInput = z.infer<typeof updatePreuveInputSchema>;

export const removePreuveInputSchema = z.object({
  preuveId: z.number().int().positive(),
  preuveType: preuveTypeEnumSchema,
});

export type RemovePreuveInput = z.infer<typeof removePreuveInputSchema>;
