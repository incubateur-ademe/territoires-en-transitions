import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { boolean, integer, pgSchema, varchar } from "drizzle-orm/pg-core";

export const importsSchema = pgSchema('imports');

export const regionTable = importsSchema.table('region', {
  code: varchar('code', { length: 2 }),
  population: integer('population').notNull(),
  libelle: varchar('libelle', { length: 30 }),
  drom: boolean('drom').notNull(),
});
export type RegionType = InferSelectModel<typeof regionTable>;
export type CreateRegionType = InferInsertModel<typeof regionTable>;