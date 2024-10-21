import { z } from 'zod';

export type TypeTag =
  | 'personne'
  | 'service'
  | 'partenaire'
  | 'categorie'
  | 'financeur'
  | 'structure';

export const tagSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  nom: z.string(),
});

export type Tag = z.input<typeof tagSchema>;

export const tagUpdateSchema = tagSchema.partial();

export type TagUpdate = z.input<typeof tagUpdateSchema>;

export const tagInsertSchema = tagSchema.extend({
  id: z.number().optional(),
});

export type TagInsert = z.input<typeof tagInsertSchema>;
