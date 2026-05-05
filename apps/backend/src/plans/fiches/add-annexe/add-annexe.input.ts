import { lienSchema } from '@tet/backend/collectivites/documents/models/document-lien.dto';
import z from 'zod';

const addAnnexeBaseSchema = z.object({
  ficheId: z.number().int().positive(),
  commentaire: z.string().optional(),
});

export const addAnnexeWithFileInputSchema = addAnnexeBaseSchema.extend({
  fichierId: z.number().int().positive(),
});
export type AddAnnexeWithFileInput = z.infer<
  typeof addAnnexeWithFileInputSchema
>;

export const addAnnexeWithLinkInputSchema = addAnnexeBaseSchema.extend({
  lien: lienSchema,
});
export type AddAnnexeWithLinkInput = z.infer<
  typeof addAnnexeWithLinkInputSchema
>;

export const addAnnexeInputSchema = z.union([
  addAnnexeWithFileInputSchema,
  addAnnexeWithLinkInputSchema,
]);

export type AddAnnexeInput = z.infer<typeof addAnnexeInputSchema>;
