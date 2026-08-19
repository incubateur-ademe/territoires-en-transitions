import { lienSchema } from '@tet/domain/collectivites';
import z from 'zod';

const addPreuveBaseSchema = z.object({
  collectiviteId: z.number().int().positive(),
  commentaire: z.string().optional(),
});

export const addPreuveReglementaireWithFileInputSchema =
  addPreuveBaseSchema.extend({
    preuveId: z.string().min(1),
    fichierId: z.number().int().positive(),
  });
export type AddPreuveReglementaireWithFileInput = z.infer<
  typeof addPreuveReglementaireWithFileInputSchema
>;

export const addPreuveReglementaireWithLinkInputSchema =
  addPreuveBaseSchema.extend({
    preuveId: z.string().min(1),
    lien: lienSchema,
  });
export type AddPreuveReglementaireWithLinkInput = z.infer<
  typeof addPreuveReglementaireWithLinkInputSchema
>;

export const addPreuveReglementaireInputSchema = z.union([
  addPreuveReglementaireWithFileInputSchema,
  addPreuveReglementaireWithLinkInputSchema,
]);
export type AddPreuveReglementaireInput = z.infer<
  typeof addPreuveReglementaireInputSchema
>;

export const addPreuveComplementaireWithFileInputSchema =
  addPreuveBaseSchema.extend({
    actionId: z.string().min(1),
    fichierId: z.number().int().positive(),
  });
export type AddPreuveComplementaireWithFileInput = z.infer<
  typeof addPreuveComplementaireWithFileInputSchema
>;

export const addPreuveComplementaireWithLinkInputSchema =
  addPreuveBaseSchema.extend({
    actionId: z.string().min(1),
    lien: lienSchema,
  });
export type AddPreuveComplementaireWithLinkInput = z.infer<
  typeof addPreuveComplementaireWithLinkInputSchema
>;

export const addPreuveComplementaireInputSchema = z.union([
  addPreuveComplementaireWithFileInputSchema,
  addPreuveComplementaireWithLinkInputSchema,
]);
export type AddPreuveComplementaireInput = z.infer<
  typeof addPreuveComplementaireInputSchema
>;