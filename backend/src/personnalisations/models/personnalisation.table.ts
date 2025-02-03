import { actionIdReference } from '@/backend/referentiels/models/action-relation.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const personnalisationTable = pgTable('personnalisation', {
  actionId: actionIdReference.primaryKey().notNull(),
  titre: text('titre').notNull(),
  description: text('description').notNull(),
});

export type PersonnalisationType = InferSelectModel<
  typeof personnalisationTable
>;
export type CreatePersonnalisationRegleType = InferInsertModel<
  typeof personnalisationTable
>;
export const personnalisationSchema = createSelectSchema(personnalisationTable);
export const createPersonnalisationSchema = createInsertSchema(
  personnalisationTable
);
