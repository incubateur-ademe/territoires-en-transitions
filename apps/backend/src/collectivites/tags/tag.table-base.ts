import { integer, serial, text } from 'drizzle-orm/pg-core';
import z from 'zod';
import { collectiviteTable } from '../shared/models/collectivite.table';

export const TagEnum = {
  Financeur : 'financeur',
  Personne : 'personne',
  Partenaire : 'partenaire',
  Service : 'service',
  Structure : 'structure',
  Categorie : 'categorie',
  Libre : 'libre'
} as const;

export type TagType = typeof TagEnum [keyof typeof TagEnum];

export const tagTableBase = {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
};

export const tagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.number(),
});
export type Tag = z.infer<typeof tagSchema>;

export const tagWithOptionalCollectiviteSchema = tagSchema.extend({
  collectiviteId: z.number().optional().nullable(),
});
export type TagWithOptionalCollectivite = z.infer<
  typeof tagWithOptionalCollectiviteSchema
>;

export const tagUpdateSchema = tagSchema.partial();
export type TagUpdate = z.input<typeof tagUpdateSchema>;

export const tagInsertSchema = tagSchema.extend({
  id: z.number().optional(),
});
export type TagInsert = z.input<typeof tagInsertSchema>;
