import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { TokenUsage } from '@tet/backend/utils/llm/llm.repository';
import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import { sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { ClassificationDraft } from './classification-draft';
import {
  classificationLeviersJobInFlightStatuses,
  classificationLeviersJobStatusValues,
} from './classification-leviers-job';

export const inFlightStatusPredicate = sql.raw(
  `status in (${classificationLeviersJobInFlightStatuses
    .map((status) => `'${status}'`)
    .join(', ')})`
);

export const classificationLeviersJobTable = pgTable(
  'classification_leviers_job',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    planId: integer('plan_id')
      .notNull()
      .references(() => axeTable.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => authUsersTable.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: classificationLeviersJobStatusValues,
    }).notNull(),
    processedBatches: integer('processed_batches').notNull().default(0),
    totalBatches: integer('total_batches').notNull().default(0),
    draft: jsonb('draft').$type<ClassificationDraft>(),
    tokenUsage: jsonb('token_usage').$type<TokenUsage>(),
    error: text('error'),
    createdAt,
    modifiedAt,
  },
  (table) => [
    uniqueIndex('classification_leviers_job_in_flight_unique')
      .on(table.planId)
      .where(inFlightStatusPredicate),
  ]
);
