import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm/sql';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { actionIdReference } from '../../referentiels/models/action-definition.table';

export const regleTypeEnum = pgEnum('regle_type', [
  'score',
  'desactivation',
  'reduction',
]);

export const personnalisationRegleTable = pgTable(
  'personnalisation_regle',
  {
    actionId: actionIdReference.notNull(),
    type: regleTypeEnum('type').notNull(),
    formule: text('formule').notNull(),
    description: text('description').notNull(),
    modifiedAt: timestamp('modified_at', { withTimezone: true, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      personnalisationReglePkey: primaryKey({
        columns: [table.actionId, table.type],
        name: 'personnalisation_regle_pkey',
      }),
    };
  }
);

export type PersonnalisationRegleType = InferSelectModel<
  typeof personnalisationRegleTable
>;
export type CreatePersonnalisationRegleType = InferInsertModel<
  typeof personnalisationRegleTable
>;
export const personnalisationRegleSchema = createSelectSchema(
  personnalisationRegleTable
);
export const createPersonnalisationRegleSchema = createInsertSchema(
  personnalisationRegleTable
);
