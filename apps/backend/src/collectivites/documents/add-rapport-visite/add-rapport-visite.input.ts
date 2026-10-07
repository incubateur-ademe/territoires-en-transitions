import { lienInputSchema, notApplicable } from '@tet/domain/collectivites';
import z from 'zod';

const addRapportVisiteBaseShape = {
  collectiviteId: z.number().int().positive(),
  date: z.iso.date(),
  commentaire: z.string().optional(),
};

const addRapportVisiteWithFichierInputSchema = z.strictObject({
  ...addRapportVisiteBaseShape,
  fichierId: z.number().int().positive(),
  lien: notApplicable,
});
export type AddRapportVisiteWithFichierInput = z.infer<
  typeof addRapportVisiteWithFichierInputSchema
>;

const addRapportVisiteWithLienInputSchema = z.strictObject({
  ...addRapportVisiteBaseShape,
  lien: lienInputSchema,
  fichierId: notApplicable,
});
export type AddRapportVisiteWithLienInput = z.infer<
  typeof addRapportVisiteWithLienInputSchema
>;

export const addRapportVisiteInputSchema = z.union([
  addRapportVisiteWithFichierInputSchema,
  addRapportVisiteWithLienInputSchema,
]);

export type AddRapportVisiteInput = z.infer<typeof addRapportVisiteInputSchema>;
