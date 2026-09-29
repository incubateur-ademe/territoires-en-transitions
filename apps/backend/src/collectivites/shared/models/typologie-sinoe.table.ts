import { InferSelectModel } from 'drizzle-orm';
import { pgTable, text, varchar } from 'drizzle-orm/pg-core';

/** Typologie SINOE (ADEME) des communes et EPCI */
export const typologieSinoeTable = pgTable('typologie_sinoe', {
  id: varchar('id', { length: 32 }).primaryKey(),
  codeSinoe: varchar('code_sinoe', { length: 4 }).notNull().unique(),
  libelle: text('libelle').notNull(),
});

export type TypologieSinoe = InferSelectModel<typeof typologieSinoeTable>;
