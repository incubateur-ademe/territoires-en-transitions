import { ObjetPreuveEnum } from '@tet/domain/referentiels';
import z from 'zod';

export const createLabellisationPreuveInputSchema = z.object({
  fichierId: z.number().int().positive(),
  commentaire: z.optional(z.string()),
  demandeId: z.number().int().positive(),
  objet: z.optional(z.enum(ObjetPreuveEnum)),
});

export type CreateLabellisationPreuveInput = z.infer<
  typeof createLabellisationPreuveInputSchema
>;
