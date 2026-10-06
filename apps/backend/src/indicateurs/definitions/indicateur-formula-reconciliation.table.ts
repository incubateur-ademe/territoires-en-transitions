import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import {
  integer,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';

const privateSchema = pgSchema('private');

export const indicateurFormulaReconciliationTable = privateSchema.table(
  'indicateur_reconciliation_formule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    generation: uuid('generation').notNull(),
    indicateurId: integer('indicateur_id')
      .notNull()
      .references(() => indicateurDefinitionTable.id, { onDelete: 'cascade' }),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    expectedFormula: text('formule_attendue'),
    createdAt: timestamp('created_at', TIMESTAMP_OPTIONS)
      .notNull()
      .defaultNow(),
    nextAttemptAt: timestamp('next_attempt_at', TIMESTAMP_OPTIONS)
      .notNull()
      .defaultNow(),
    failureCount: integer('failure_count').notNull().default(0),
    lastFailedAt: timestamp('last_failed_at', TIMESTAMP_OPTIONS),
    lastError: text('last_error'),
  },
  (table) => [
    unique('indicateur_reconciliation_formule_generation_unique').on(
      table.generation,
      table.indicateurId,
      table.collectiviteId
    ),
  ]
);
