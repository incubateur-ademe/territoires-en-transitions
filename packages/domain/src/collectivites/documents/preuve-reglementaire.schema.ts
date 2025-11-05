import * as z from 'zod/mini';
import { preuveBaseSchema } from './preuve-base.schema';

export const preuveReglementaireSchema = z.object({
  ...preuveBaseSchema.shape,
  preuveId: z.string(),
});

export type PreuveReglementaire = z.infer<typeof preuveReglementaireSchema>;

export const preuveReglementaireCreateSchema = z.object({
  id: z.optional(z.number()),
  collectiviteId: z.number(),
  fichierId: z.optional(z.nullable(z.number())),
  url: z.optional(z.nullable(z.string())),
  titre: z.optional(z.nullable(z.string())),
  commentaire: z.optional(z.nullable(z.string())),
  modifiedAt: z.optional(z.iso.datetime()),
  modifiedBy: z.optional(z.nullable(z.uuid())),
  lien: z.optional(z.nullable(z.any())),
  preuveId: z.string(),
});

export type PreuveReglementaireCreate = z.infer<
  typeof preuveReglementaireCreateSchema
>;
