import { actionIdReference } from '@/backend/referentiels/models/action-relation.table';
import { modifiedAt } from '@/backend/utils/column.utils';
import { pgEnum, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const regleType = ['score', 'desactivation', 'reduction'] as const;

export const regleTypeEnum = pgEnum('regle_type', regleType);

export const personnalisationRegleTable = pgTable(
  'personnalisation_regle',
  {
    actionId: actionIdReference.notNull(),
    type: regleTypeEnum('type').notNull(),
    formule: text('formule').notNull(),
    description: text('description').notNull(),
    modifiedAt,
  },
  (table) => [
    primaryKey({
      columns: [table.actionId, table.type],
      name: 'personnalisation_regle_pkey',
    }),
  ]
);

export type PersonnalisationRegle =
  typeof personnalisationRegleTable.$inferSelect;
export type PersonnalisationRegleInsert =
  typeof personnalisationRegleTable.$inferInsert;

export const personnalisationRegleSchema = createSelectSchema(
  personnalisationRegleTable
);
export const personnalisationRegleInsertSchema = createInsertSchema(
  personnalisationRegleTable
);
